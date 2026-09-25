import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const job = (yaml, id) => yaml.match(new RegExp(`^  ${id}:\\n([\\s\\S]*?)(?=^  [\\w-]+:|$(?![\\s\\S]))`, 'm'))?.[1] ?? ''

test('CI actionlint gate must pass before build, E2E and visual jobs', () => {
  const ci = read('.github/workflows/ci.yml')
  assert.match(job(ci, 'workflow-lint'), /bash scripts\/lint-workflows\.sh/)
  assert.match(job(ci, 'workflow-lint'), /contents: read/)
  assert.match(job(ci, 'workflow-lint'), /persist-credentials: false/)
  assert.match(job(ci, 'verify'), /needs: workflow-lint/)
  for (const name of ['e2e', 'visual']) assert.match(job(ci, name), /needs: verify/)
  assert.doesNotMatch(job(ci, 'workflow-lint'), /continue-on-error:|always\(\)|:\s*write\b/)
})

test('Pages and manual production acceptance lint before installing application dependencies', () => {
  for (const file of ['pages.yml', 'production-acceptance.yml']) {
    const yaml = read(`.github/workflows/${file}`)
    const lint = yaml.indexOf('run: bash scripts/lint-workflows.sh')
    assert.ok(lint >= 0, `${file} needs an actionlint step`)
    assert.ok(lint < yaml.indexOf('uses: actions/setup-node@'), `${file}: lint precedes Node setup`)
    assert.ok(lint < yaml.indexOf('run: npm install'), `${file}: lint precedes install`)
    assert.doesNotMatch(yaml.slice(0, lint), /continue-on-error:/)
  }
})

test('installer pins and verifies the official archive before extraction or execution', () => {
  const script = read('scripts/lint-workflows.sh')
  assert.match(script, /version='1\.7\.12'/)
  assert.match(script, /checksum='8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8'/)
  assert.match(script, /sha256sum --check/)
  assert.ok(script.indexOf('sha256sum --check') < script.indexOf('tar -xzf'))
  assert.match(script, /set -euo pipefail/)
  assert.match(script, /curl --fail --location/)
  assert.match(script, /trap .*EXIT/)
  assert.doesNotMatch(script, /\|\s*(bash|sh)(?:\s|$)|\|\|\s*true|-ignore\b|@latest/)
})

test('manual acceptance remains dispatch-only and read-only', () => {
  const yaml = read('.github/workflows/production-acceptance.yml')
  assert.match(yaml, /on:\n  workflow_dispatch:/)
  assert.doesNotMatch(yaml, /^  (push|schedule|pull_request|workflow_run):/m)
  assert.doesNotMatch(yaml, /:\s*write\b|git push|git commit|\[skip ci\]/)
})

function downloadFailure(t, body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'actionlint-download-test-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const bin = path.join(dir, 'bin')
  fs.mkdirSync(bin)
  fs.writeFileSync(path.join(bin, 'curl'), `#!/usr/bin/env bash\n${body}\n`, { mode: 0o755 })
  const result = spawnSync('bash', ['scripts/lint-workflows.sh'], {
    cwd: root, encoding: 'utf8', timeout: 5000,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TMPDIR: dir },
  })
  assert.equal(result.error, undefined)
  assert.notEqual(result.status, 0)
  assert.doesNotMatch(result.stdout, /WORKFLOW_LINT_PASS/)
  assert.equal(fs.readdirSync(dir).filter(name => name.startsWith('rocket-actionlint.')).length, 0)
  return result
}

test('a corrupted download fails the checksum and leaves no temporary installation', t => {
  const result = downloadFailure(t, 'while (( $# )); do if [[ "$1" == --output ]]; then printf "corrupt archive" > "$2"; exit 0; fi; shift; done; exit 99')
  assert.match(result.stderr, /checksum|FAILED|did NOT match/i)
})

test('HTTP/download failure propagates rather than running a missing binary', t => {
  const result = downloadFailure(t, 'exit 22')
  assert.equal(result.status, 22)
})
