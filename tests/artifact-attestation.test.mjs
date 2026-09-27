import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const ci = read('.github/workflows/ci.yml')
const pages = read('.github/workflows/pages.yml')
const verifier = read('scripts/verify-site-attestation.sh')
const job = (yaml, id) => yaml.match(new RegExp('^  ' + id + ':\\n([\\s\\S]*?)(?=^  [\\w-]+:|$(?![\\s\\S]))', 'm'))?.[1] ?? ''

test('main publish signs only the fully tested tar and self-verifies before success', () => {
  const publish = job(ci, 'publish')
  assert.match(publish, /permissions:[\s\S]*contents: read[\s\S]*id-token: write[\s\S]*attestations: write/)
  assert.match(publish, /uses: actions\/attest@v4[\s\S]*subject-path: \$\{\{ runner\.temp \}\}\/tested-site\/artifact\.tar/)
  assert.match(publish, /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/)
  assert.match(publish, /bash scripts\/verify-site-attestation\.sh/)
  assert.ok(publish.indexOf('site_artifact.py certify') < publish.indexOf('uses: actions/attest@v4'))
  assert.ok(publish.indexOf('uses: actions/attest@v4') < publish.indexOf('bash scripts/verify-site-attestation.sh'))
})

test('Pages verifies provenance both before promotion and on the transported tar', () => {
  for (const id of ['promote', 'deploy']) {
    const text = job(pages, id)
    assert.match(text, /attestations: read/)
    assert.match(text, /bash scripts\/verify-site-attestation\.sh/)
  }
  assert.match(job(pages, 'promote'), /SITE_ATTESTATION_SUBJECT: \$\{\{ runner\.temp \}\}\/tested-site\/artifact\.tar/)
  assert.match(job(pages, 'deploy'), /SITE_ATTESTATION_SUBJECT: \$\{\{ runner\.temp \}\}\/pages-payload\/artifact\.tar/)
  assert.ok(job(pages, 'deploy').indexOf('site_artifact.py hash') < job(pages, 'deploy').indexOf('verify-site-attestation.sh'))
})

test('verification policy pins repository, main source, exact commit and CI signer workflow', () => {
  for (const token of ['--repo "$repo"', '--signer-workflow "$repo/.github/workflows/ci.yml"', '--source-ref "$source_ref"', '--source-digest "$sha"', "--predicate-type 'https://slsa.dev/provenance/v1'", '--deny-self-hosted-runners']) assert.ok(verifier.includes(token), token)
  assert.ok(verifier.includes("refs/heads/main"))
})

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocket-attestation-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const bin = path.join(dir, 'bin'); fs.mkdirSync(bin)
  const args = path.join(dir, 'args.txt')
  fs.writeFileSync(path.join(bin, 'gh'), '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > "$GH_ARGS"\n', { mode: 0o755 })
  const subject = path.join(dir, 'artifact.tar'); fs.writeFileSync(subject, 'payload')
  const env = { ...process.env, PATH: bin + ':' + process.env.PATH, GH_ARGS: args,
    GH_TOKEN: 'test-token', GITHUB_REPOSITORY: 'xuan2261/Rocket-Anatomy-Lab',
    SITE_ATTESTATION_SUBJECT: subject, SITE_SHA: 'a'.repeat(40), SITE_SOURCE_REF: 'refs/heads/main' }
  return { dir, args, subject, env }
}

test('verifier executes gh with all fail-closed provenance constraints', t => {
  const f = fixture(t)
  const result = spawnSync('bash', ['scripts/verify-site-attestation.sh'], { cwd: root, env: f.env, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  const args = fs.readFileSync(f.args, 'utf8')
  for (const value of ['attestation', 'verify', f.subject, '--repo', 'xuan2261/Rocket-Anatomy-Lab', '--signer-workflow', 'xuan2261/Rocket-Anatomy-Lab/.github/workflows/ci.yml', '--source-ref', 'refs/heads/main', '--source-digest', 'a'.repeat(40), '--predicate-type', 'https://slsa.dev/provenance/v1', '--deny-self-hosted-runners']) assert.ok(args.includes(value), value)
  assert.match(result.stdout, /SITE_ATTESTATION_PASS/)
})

test('invalid repository, ref, SHA, token or subject fails before invoking gh', t => {
  const changes = [
    { GITHUB_REPOSITORY: 'fork/repo' },
    { SITE_SOURCE_REF: 'refs/heads/topic' },
    { SITE_SHA: 'abc1234' },
    { GH_TOKEN: '' },
    { SITE_ATTESTATION_SUBJECT: path.join(os.tmpdir(), 'missing-attestation-subject') },
  ]
  for (const change of changes) {
    const f = fixture(t)
    const result = spawnSync('bash', ['scripts/verify-site-attestation.sh'], { cwd: root, env: { ...f.env, ...change }, encoding: 'utf8' })
    assert.equal(result.status, 2)
    assert.equal(fs.existsSync(f.args), false)
  }
})
