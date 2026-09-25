#!/usr/bin/env python3
"""Pack, verify, test and promote the same Pages tar. Python standard library only.

The archive is data, never an executable or a workflow. No generic extractall,
network credentials, source mutation, download fallback, or rebuild is used.
"""
import hashlib
import io
import json
import os
import pathlib
import re
import shutil
import stat
import sys
import tarfile
import time
import urllib.parse
import urllib.request

REPOSITORY = 'xuan2261/Rocket-Anatomy-Lab'
LIVE = 'https://xuan2261.github.io/Rocket-Anatomy-Lab/'
MAX_BYTES = 512 * 1024 * 1024
MAX_FILES = 10000
REQUIRED = {'index.html', 'bootstrap.mjs', 'core/engine.js', 'assets/saturn-v-education.glb'}
LANES = {'e2e', 'visual'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_name(name):
    require(isinstance(name, str) and name and not name.startswith('/') and '\\' not in name
            and all(ord(c) >= 32 for c in name), 'Invalid archive path')
    require(all(part not in ('', '.', '..', '.git', '.github') for part in name.split('/')),
            'Unsafe archive path')
    require(not any(part.startswith('.') and part != '.nojekyll' for part in name.split('/')),
            'Hidden source or credential files cannot enter the release')
    return name


def validate_identity(value):
    require(value.get('repository') == REPOSITORY, 'Wrong repository')
    require(isinstance(value.get('sha'), str) and re.fullmatch(r'[a-f0-9]{40}', value['sha']), 'Invalid commit SHA')
    for key in ('runId', 'runAttempt'):
        require(isinstance(value.get(key), str) and re.fullmatch(r'[1-9][0-9]*', value[key]), 'Invalid run identity')


def match_identity(actual, expected):
    validate_identity(expected)
    require(all(actual.get(key) == expected[key] for key in ('repository', 'sha', 'runId', 'runAttempt')),
            'Artifact identity differs from expected CI revision/run/attempt')


def load_json(filename):
    filename = pathlib.Path(filename)
    require(filename.is_file() and not filename.is_symlink() and filename.stat().st_size <= 8 * 1024 * 1024,
            'Missing or invalid JSON evidence')
    value = json.loads(filename.read_text(encoding='utf-8'))
    require(isinstance(value, dict), 'Evidence must be a JSON object')
    return value


def write_json(filename, value):
    with pathlib.Path(filename).open('x', encoding='utf-8') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')


def inventory(root):
    root = pathlib.Path(root)
    require(root.is_dir() and not root.is_symlink(), 'Invalid site directory')
    files = []
    for item in sorted(root.rglob('*')):
        info = item.lstat()
        require(not stat.S_ISLNK(info.st_mode), 'Links are not allowed in a site artifact')
        if stat.S_ISDIR(info.st_mode):
            continue
        require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1, 'Only independent regular files are allowed')
        name = safe_name(item.relative_to(root).as_posix())
        require(info.st_size <= MAX_BYTES, 'File exceeds artifact limit')
        files.append({'path': name, 'size': info.st_size, 'sha256': digest(item.read_bytes())})
    require(0 < len(files) <= MAX_FILES and sum(f['size'] for f in files) <= MAX_BYTES, 'Invalid site size')
    require(REQUIRED <= {f['path'] for f in files}, 'Incomplete application site')
    return files


def validate_manifest(manifest, identity):
    match_identity(manifest, identity)
    require(manifest.get('schema') == 1, 'Unsupported manifest schema')
    require(isinstance(manifest.get('sha256'), str) and re.fullmatch(r'[a-f0-9]{64}', manifest['sha256']), 'Invalid tar checksum')
    require(type(manifest.get('bytes')) is int and 0 < manifest['bytes'] <= MAX_BYTES, 'Invalid tar size')
    files = manifest.get('files')
    require(isinstance(files, list) and 0 < len(files) <= MAX_FILES, 'Invalid manifest file list')
    names = []
    for entry in files:
        require(isinstance(entry, dict), 'Invalid file entry')
        names.append(safe_name(entry.get('path')))
        require(type(entry.get('size')) is int and 0 <= entry['size'] <= MAX_BYTES, 'Invalid file size')
        require(isinstance(entry.get('sha256'), str) and re.fullmatch(r'[a-f0-9]{64}', entry['sha256']), 'Invalid file checksum')
    require(names == sorted(set(names)) and REQUIRED <= set(names), 'Missing, unsorted or duplicate manifest files')
    require(sum(f['size'] for f in files) <= MAX_BYTES, 'Expanded artifact exceeds limit')
    for name in names:
        require(not any(str(parent) in names for parent in pathlib.PurePosixPath(name).parents if str(parent) != '.'),
                'File/directory path collision')


def inspect_tar(filename, manifest):
    filename = pathlib.Path(filename)
    require(filename.is_file() and not filename.is_symlink() and filename.stat().st_size == manifest['bytes'], 'Tar size mismatch')
    data = filename.read_bytes()
    require(digest(data) == manifest['sha256'], 'Tar checksum mismatch')
    extracted = {}
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:') as archive:
        for member in archive:
            # Pages requires the same leading ./ convention as its official
            # archive action. Remove exactly that prefix, then apply path safety.
            require(member.name.startswith('./'), 'Pages archive paths must start with ./')
            name = safe_name(member.name[2:])
            require(member.type in (tarfile.REGTYPE, tarfile.AREGTYPE) and not member.pax_headers,
                    'Archive must contain only regular USTAR files')
            require(name not in extracted and len(extracted) < MAX_FILES, 'Duplicate or excessive archive members')
            require(0 <= member.size <= MAX_BYTES and member.offset_data + member.size <= len(data), 'Invalid member bounds')
            stream = archive.extractfile(member)
            require(stream is not None, 'Missing file payload')
            body = stream.read(MAX_BYTES + 1)
            require(len(body) == member.size, 'Truncated file payload')
            extracted[name] = body
    actual = [{'path': name, 'size': len(body), 'sha256': digest(body)} for name, body in sorted(extracted.items())]
    require(actual == manifest['files'], 'Archive contents differ from the complete manifest')
    return extracted


def verify_bundle(bundle, identity, tested=False):
    bundle = pathlib.Path(bundle)
    require(bundle.is_dir() and not bundle.is_symlink(), 'Missing artifact bundle')
    names = {p.name for p in bundle.iterdir()}
    required = {'artifact.tar', 'manifest.json'} | ({'verification.json'} if tested else set())
    require(names == required, 'Unexpected or missing bundle members')
    manifest = load_json(bundle / 'manifest.json')
    validate_manifest(manifest, identity)
    inspect_tar(bundle / 'artifact.tar', manifest)
    if tested:
        verification = load_json(bundle / 'verification.json')
        match_identity(verification, identity)
        require(verification.get('schema') == 1 and verification.get('status') == 'PASS'
                and verification.get('sha256') == manifest['sha256'], 'Invalid tested-artifact certification')
        validate_proofs(verification.get('proofs'), manifest, identity)
    return manifest


def fresh_directory(destination):
    destination = pathlib.Path(destination)
    require(not destination.exists() and not destination.is_symlink(), 'Output already exists; never overwrite evidence')
    destination.mkdir()
    return destination


def pack(site, destination, identity):
    validate_identity(identity)
    site = pathlib.Path(site)
    files = inventory(site)
    dest = fresh_directory(destination)
    try:
        with tarfile.open(dest / 'artifact.tar', mode='w', format=tarfile.USTAR_FORMAT) as archive:
            for entry in files:
                member = tarfile.TarInfo('./' + entry['path'])
                member.size = entry['size']; member.mode = 0o644; member.mtime = 0
                with (site / entry['path']).open('rb') as stream:
                    archive.addfile(member, stream)
        payload = (dest / 'artifact.tar').read_bytes()
        manifest = {'schema': 1, **identity, 'sha256': digest(payload), 'bytes': len(payload), 'files': files}
        write_json(dest / 'manifest.json', manifest)
        verify_bundle(dest, identity)
        return manifest
    except Exception:
        shutil.rmtree(dest)
        raise


def restore(bundle, target, identity):
    manifest = verify_bundle(bundle, identity)
    files = inspect_tar(pathlib.Path(bundle) / 'artifact.tar', manifest)
    dest = fresh_directory(target)
    try:
        # Prevalidation above rejects links, traversal, duplicate paths and collisions.
        # Explicit file writes avoid extractall and any platform-dependent link handling.
        for name, body in files.items():
            filename = dest / name
            filename.parent.mkdir(parents=True, exist_ok=True)
            with filename.open('xb') as stream:
                stream.write(body)
        verify_tree(dest, manifest)
        return manifest
    except Exception:
        shutil.rmtree(dest)
        raise


def verify_tree(target, manifest):
    require(inventory(target) == manifest['files'], 'Tested site tree was changed, incomplete or replaced')


def write_proof(bundle, target, output, identity, lane):
    require(lane in LANES, 'Unknown test lane')
    manifest = verify_bundle(bundle, identity)
    verify_tree(target, manifest)
    proof = {'schema': 1, **identity, 'lane': lane, 'status': 'PASS', 'sha256': manifest['sha256'],
             'treeUnchanged': True}
    write_json(output, proof)
    return proof


def validate_proofs(proofs, manifest, identity):
    require(isinstance(proofs, list) and len(proofs) == 2 and all(isinstance(p, dict) for p in proofs), 'Missing test receipts')
    require({p.get('lane') for p in proofs} == LANES, 'Missing or duplicate browser lane')
    for proof in proofs:
        match_identity(proof, identity)
        require(proof.get('schema') == 1 and proof.get('status') == 'PASS' and proof.get('treeUnchanged') is True
                and proof.get('sha256') == manifest['sha256'], 'Test receipt differs from candidate or did not pass')


def certify(bundle, proofdir, destination, identity):
    manifest = verify_bundle(bundle, identity)
    proofdir = pathlib.Path(proofdir)
    require({p.name for p in proofdir.iterdir()} == {'e2e.json', 'visual.json'}, 'Missing or unexpected test evidence')
    proofs = [load_json(proofdir / (lane + '.json')) for lane in sorted(LANES)]
    validate_proofs(proofs, manifest, identity)
    dest = fresh_directory(destination)
    try:
        for filename in ['artifact.tar', 'manifest.json']:
            shutil.copyfile(pathlib.Path(bundle) / filename, dest / filename)
        write_json(dest / 'verification.json', {'schema': 1, **identity, 'status': 'PASS',
                   'sha256': manifest['sha256'], 'proofs': proofs})
        verify_bundle(dest, identity, tested=True)
        return manifest
    except Exception:
        shutil.rmtree(dest)
        raise


def verify_tar_hash(filename, expected):
    require(isinstance(expected, str) and re.fullmatch(r'[a-f0-9]{64}', expected), 'Invalid expected payload checksum')
    filename = pathlib.Path(filename)
    require(filename.is_file() and not filename.is_symlink() and filename.stat().st_size <= MAX_BYTES, 'Invalid promoted payload')
    require(digest(filename.read_bytes()) == expected, 'Promoted payload differs from the tested tar')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Unexpected live-site redirect')


def verify_live(bundle, identity, output):
    manifest = verify_bundle(bundle, identity, tested=True)
    opener = urllib.request.build_opener(NoRedirect())
    rows = []
    for entry in manifest['files']:
        url = LIVE + urllib.parse.quote(entry['path'], safe='/')
        last = None
        for attempt in range(3):
            try:
                request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'})
                with opener.open(request, timeout=30) as response:
                    body = response.read(entry['size'] + 1)
                require(len(body) == entry['size'] and digest(body) == entry['sha256'], 'Deployed bytes mismatch')
                last = None
                break
            except Exception as error:
                last = str(error)
                if attempt < 2: time.sleep(3)
        rows.append({'path': entry['path'], 'matches': last is None, 'error': last})
    status = 'PASS' if all(row['matches'] for row in rows) else 'FAIL'
    result = {'schema': 1, **identity, 'status': status, 'sha256': manifest['sha256'], 'files': rows}
    write_json(output, result)
    require(status == 'PASS', 'Live files do not match the tested artifact; see byte-verification report')
    return manifest


def main():
    env = os.environ
    identity = {'repository': REPOSITORY, 'sha': env.get('SITE_SHA', env.get('GITHUB_SHA', '')),
                'runId': env.get('SITE_RUN_ID', env.get('GITHUB_RUN_ID', '')),
                'runAttempt': env.get('SITE_RUN_ATTEMPT', env.get('GITHUB_RUN_ATTEMPT', ''))}
    command = sys.argv[1]
    if command == 'hash':
        folder = pathlib.Path(env['SITE_PACKAGE_DIR'])
        require({p.name for p in folder.iterdir()} == {'artifact.tar'}, 'Promoted artifact contains unexpected files')
        verify_tar_hash(folder / 'artifact.tar', env['SITE_TAR_SHA256'])
        print('SITE_PAYLOAD_PASS ' + env['SITE_TAR_SHA256'])
        return
    bundle = pathlib.Path(env['SITE_PACKAGE_DIR'])
    if command == 'pack':
        manifest = pack(pathlib.Path('public'), bundle, identity)
    elif command == 'restore':
        target = pathlib.Path(env['ROCKET_PUBLIC_ROOT'])
        require(not target.resolve().is_relative_to(pathlib.Path.cwd().resolve()), 'Use an outside-source test directory')
        manifest = restore(bundle, target, identity)
    elif command == 'proof':
        manifest = write_proof(bundle, pathlib.Path(env['ROCKET_PUBLIC_ROOT']),
                               pathlib.Path(env['SITE_PROOF_DIR']) / (sys.argv[2] + '.json'), identity, sys.argv[2])
    elif command == 'certify':
        manifest = certify(bundle, pathlib.Path(env['SITE_PROOF_DIR']), pathlib.Path(env['SITE_TESTED_DIR']), identity)
    elif command == 'verify':
        manifest = verify_bundle(bundle, identity, tested=True)
    elif command == 'live':
        manifest = verify_live(bundle, identity, pathlib.Path(env['SITE_LIVE_REPORT']))
    else:
        raise ValueError('Unknown artifact operation')
    print('SITE_ARTIFACT_PASS ' + json.dumps({'operation': command, **identity, 'sha256': manifest['sha256']}))
    if env.get('GITHUB_OUTPUT'):
        with open(env['GITHUB_OUTPUT'], 'a') as stream:
            stream.write('tar_sha256=' + manifest['sha256'] + '\n')
    if env.get('GITHUB_STEP_SUMMARY'):
        with open(env['GITHUB_STEP_SUMMARY'], 'a') as stream:
            stream.write(f"## Site artifact: {command} PASS\n\nSHA: `{identity['sha']}`\n\n"
                         f"CI run/attempt: {identity['runId']}/{identity['runAttempt']}\n\n"
                         f"Payload SHA-256: `{manifest['sha256']}`\n\n")


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('SITE_ARTIFACT_BLOCKED: ' + str(error), file=sys.stderr)
        sys.exit(1)
