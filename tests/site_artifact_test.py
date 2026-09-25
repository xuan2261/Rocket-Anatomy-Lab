import copy
import hashlib
import importlib.util
import io
import json
import pathlib
import subprocess
import tarfile
import tempfile
import unittest
from unittest import mock

SOURCE = pathlib.Path(__file__).resolve().parents[1] / 'scripts' / 'site_artifact.py'
spec = importlib.util.spec_from_file_location('site_artifact', SOURCE)
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)


class SiteArtifactTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='rocket-artifact-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        self.site = self.root / 'source'
        self.site.mkdir()
        self.identity = {'repository': 'xuan2261/Rocket-Anatomy-Lab', 'sha': 'a' * 40,
                         'runId': '123', 'runAttempt': '1'}
        self.files = {'index.html': b'<h1>Test</h1>', 'bootstrap.mjs': b'export {}',
                      'core/engine.js': b'export const state = 1',
                      'assets/saturn-v-education.glb': bytes(range(256)),
                      '.nojekyll': b''}
        for name, data in self.files.items():
            dest = self.site / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
        self.bundle = self.root / 'candidate'

    def pack(self):
        return a.pack(self.site, self.bundle, self.identity)

    def test_pack_is_deterministic_and_gnu_tar_can_read_exact_files(self):
        first = self.pack()
        second = self.root / 'second'
        a.pack(self.site, second, self.identity)
        self.assertEqual((self.bundle / 'artifact.tar').read_bytes(), (second / 'artifact.tar').read_bytes())
        self.assertEqual(first['sha256'], hashlib.sha256((self.bundle / 'artifact.tar').read_bytes()).hexdigest())
        dest = self.root / 'gnu'; dest.mkdir()
        subprocess.run(['tar', '-xf', str(self.bundle / 'artifact.tar'), '-C', str(dest)], check=True)
        a.verify_tree(dest, first)
        self.assertEqual((dest / '.nojekyll').read_bytes(), b'')

    def test_pages_requires_exactly_one_dot_slash_archive_prefix(self):
        manifest = self.pack()
        with tarfile.open(self.bundle / 'artifact.tar') as archive:
            members = archive.getmembers()
            self.assertTrue(all(member.name.startswith('./') for member in members))
            self.assertEqual([member.name[2:] for member in members], [row['path'] for row in manifest['files']])
        # Pages rejects archives with equivalent unprefixed names. The validator
        # must catch that compatibility defect before tests and deployment.
        for prefix in ['', '././']:
            buffer = io.BytesIO()
            with tarfile.open(fileobj=buffer, mode='w', format=tarfile.USTAR_FORMAT) as archive:
                for name, body in sorted(self.files.items()):
                    member = tarfile.TarInfo(prefix + name)
                    member.size = len(body)
                    archive.addfile(member, io.BytesIO(body))
            data = buffer.getvalue()
            (self.bundle / 'artifact.tar').write_bytes(data)
            (self.bundle / 'manifest.json').write_text(json.dumps({**manifest, 'sha256': a.digest(data), 'bytes': len(data)}))
            with self.subTest(prefix=prefix), self.assertRaises(ValueError):
                a.verify_bundle(self.bundle, self.identity)

    def test_restore_uses_a_new_tree_outside_source(self):
        manifest = self.pack()
        target = self.root / 'served'
        a.restore(self.bundle, target, self.identity)
        a.verify_tree(target, manifest)
        self.assertEqual((self.site / 'index.html').read_bytes(), self.files['index.html'])
        with self.assertRaises(ValueError):
            a.restore(self.bundle, target, self.identity)

    def test_manifest_requires_all_expected_identity_fields(self):
        self.pack()
        for key, value in [('repository', 'fork/other'), ('sha', 'b' * 40), ('runId', '124'), ('runAttempt', '2')]:
            identity = {**self.identity, key: value}
            with self.subTest(key=key), self.assertRaises(ValueError):
                a.verify_bundle(self.bundle, identity)

    def test_payload_corruption_fails_before_any_extraction(self):
        self.pack()
        p = self.bundle / 'artifact.tar'
        data = bytearray(p.read_bytes()); data[600] ^= 1; p.write_bytes(data)
        with self.assertRaises(ValueError):
            a.restore(self.bundle, self.root / 'served', self.identity)
        self.assertFalse((self.root / 'served').exists())

    def test_source_symlinks_and_hardlinks_are_not_packaged(self):
        link = self.site / 'escape'; link.symlink_to(self.root)
        with self.assertRaises(ValueError): self.pack()
        link.unlink()
        link.hardlink_to(self.site / 'index.html')
        with self.assertRaises(ValueError): self.pack()

    def test_partial_site_cannot_be_published_as_the_application(self):
        (self.site / 'core/engine.js').unlink()
        with self.assertRaises(ValueError): self.pack()

    def test_mutation_extra_or_missing_file_after_test_is_rejected(self):
        manifest = self.pack()
        for op in ['edit', 'extra', 'missing']:
            target = self.root / op
            a.restore(self.bundle, target, self.identity)
            if op == 'edit': (target / 'index.html').write_bytes(b'changed')
            if op == 'extra': (target / 'extra.txt').write_bytes(b'extra')
            if op == 'missing': (target / 'bootstrap.mjs').unlink()
            with self.subTest(op=op), self.assertRaises(ValueError):
                a.verify_tree(target, manifest)

    def test_manifest_cannot_omit_or_duplicate_files(self):
        manifest = self.pack()
        for entries in [manifest['files'][:-1], manifest['files'] + [manifest['files'][0]]]:
            (self.bundle / 'manifest.json').write_text(json.dumps({**manifest, 'files': entries}))
            with self.assertRaises(ValueError): a.verify_bundle(self.bundle, self.identity)

    def test_archive_rejects_escape_links_and_duplicate_members_even_with_matching_hash(self):
        manifest = self.pack()
        original = (self.bundle / 'artifact.tar').read_bytes()
        for name, kind in [('./../outside.txt', tarfile.REGTYPE), ('/absolute', tarfile.REGTYPE),
                           ('./safe/../escape', tarfile.REGTYPE), ('./link', tarfile.SYMTYPE),
                           ('./hard', tarfile.LNKTYPE), ('./index.html', tarfile.REGTYPE)]:
            buffer = io.BytesIO()
            with tarfile.open(fileobj=buffer, mode='w', format=tarfile.USTAR_FORMAT) as tar:
                with tarfile.open(fileobj=io.BytesIO(original)) as old:
                    for member in old:
                        tar.addfile(member, old.extractfile(member))
                member = tarfile.TarInfo(name); member.type = kind
                member.size = 1 if kind == tarfile.REGTYPE else 0
                member.linkname = '../outside'
                tar.addfile(member, io.BytesIO(b'x') if member.size else None)
            payload = buffer.getvalue()
            (self.bundle / 'artifact.tar').write_bytes(payload)
            changed = {**manifest, 'sha256': hashlib.sha256(payload).hexdigest(), 'bytes': len(payload)}
            (self.bundle / 'manifest.json').write_text(json.dumps(changed))
            with self.subTest(name=name), self.assertRaises(ValueError):
                a.verify_bundle(self.bundle, self.identity)
        self.assertFalse((self.root / 'outside.txt').exists())

    def make_proofs(self):
        self.pack()
        proofdir = self.root / 'proofs'; proofdir.mkdir()
        for lane in ['e2e', 'visual']:
            target = self.root / lane
            a.restore(self.bundle, target, self.identity)
            a.write_proof(self.bundle, target, proofdir / (lane + '.json'), self.identity, lane)
        return proofdir

    def test_tested_bundle_requires_both_lanes_and_preserves_tar_bytes(self):
        proofdir = self.make_proofs()
        dest = self.root / 'tested'
        a.certify(self.bundle, proofdir, dest, self.identity)
        result = a.verify_bundle(dest, self.identity, tested=True)
        self.assertEqual((dest / 'artifact.tar').read_bytes(), (self.bundle / 'artifact.tar').read_bytes())
        self.assertEqual(result['sha256'], self.pack_digest())

    def pack_digest(self):
        return hashlib.sha256((self.bundle / 'artifact.tar').read_bytes()).hexdigest()

    def test_missing_failed_swapped_or_wrong_attempt_receipts_fail_closed(self):
        proofdir = self.make_proofs()
        original = json.loads((proofdir / 'visual.json').read_text())
        for key, value in [('lane', 'e2e'), ('status', 'FAIL'), ('sha256', '0' * 64), ('runAttempt', '2')]:
            (proofdir / 'visual.json').write_text(json.dumps({**original, key: value}))
            with self.subTest(key=key), self.assertRaises(ValueError):
                a.certify(self.bundle, proofdir, self.root / 'tested', self.identity)
        (proofdir / 'visual.json').unlink()
        with self.assertRaises(ValueError): a.certify(self.bundle, proofdir, self.root / 'tested', self.identity)
        self.assertFalse((self.root / 'tested').exists())

    def test_candidate_without_test_certification_is_not_a_release(self):
        self.pack()
        with self.assertRaises(ValueError): a.verify_bundle(self.bundle, self.identity, tested=True)

    def test_forwarded_payload_must_match_the_tested_hash(self):
        self.pack()
        a.verify_tar_hash(self.bundle / 'artifact.tar', self.pack_digest())
        with self.assertRaises(ValueError): a.verify_tar_hash(self.bundle / 'artifact.tar', '0' * 64)

    def test_outputs_never_overwrite_archived_evidence(self):
        self.bundle.mkdir(); (self.bundle / 'original').write_text('retained')
        with self.assertRaises(ValueError): self.pack()
        self.assertEqual((self.bundle / 'original').read_text(), 'retained')


    def test_live_verification_compares_all_files_and_records_mismatch(self):
        proofdir = self.make_proofs()
        tested = self.root / 'tested'
        a.certify(self.bundle, proofdir, tested, self.identity)
        class Reply(io.BytesIO):
            pass
        class Site:
            corrupt = False
            def open(inner, request, timeout):
                name = a.urllib.parse.unquote(request.full_url[len(a.LIVE):])
                body = self.files[name]
                if inner.corrupt and name == 'bootstrap.mjs': body = b'wrong file'
                return Reply(body)
        site = Site()
        with mock.patch.object(a.urllib.request, 'build_opener', return_value=site), mock.patch.object(a.time, 'sleep'):
            good = self.root / 'live-pass.json'
            a.verify_live(tested, self.identity, good)
            report = json.loads(good.read_text())
            self.assertEqual(report['status'], 'PASS')
            self.assertEqual(len(report['files']), len(self.files))
            site.corrupt = True
            bad = self.root / 'live-fail.json'
            with self.assertRaises(ValueError): a.verify_live(tested, self.identity, bad)
            report = json.loads(bad.read_text())
            self.assertEqual(report['status'], 'FAIL')
            self.assertEqual([row['path'] for row in report['files'] if not row['matches']], ['bootstrap.mjs'])

    def test_final_certification_tampering_cannot_admit_the_artifact(self):
        proofdir = self.make_proofs()
        tested = self.root / 'tested'
        a.certify(self.bundle, proofdir, tested, self.identity)
        original = a.load_json(tested / 'verification.json')
        for value in [{**original, 'sha256': '0' * 64}, {**original, 'proofs': []},
                      {**original, 'status': 'FAIL'}, {**original, 'runAttempt': '2'}]:
            (tested / 'verification.json').write_text(json.dumps(value))
            with self.assertRaises(ValueError): a.verify_bundle(tested, self.identity, tested=True)


if __name__ == '__main__': unittest.main()
