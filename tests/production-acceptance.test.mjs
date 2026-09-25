import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { prepareAcceptance } from '../scripts/lib/acceptance-config.mjs'

const workflow = fs.readFileSync(new URL('../.github/workflows/production-acceptance.yml', import.meta.url), 'utf8')
const script = fs.readFileSync(new URL('../scripts/accept-production.mjs', import.meta.url), 'utf8')

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rocket-acceptance-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const cwd = path.join(root, 'repo')
  fs.mkdirSync(cwd)
  const git = (...args) => execFileSync('git', args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
      GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' },
  }).trim()
  git('init', '--initial-branch=main')
  fs.mkdirSync(path.join(cwd, 'src'))
  fs.writeFileSync(path.join(cwd, 'src/main.ts'), 'export const value = 1\n')
  git('add', '.')
  git('commit', '-m', 'fixture')
  const revision = git('rev-parse', 'HEAD')
  const output = path.join(root, 'evidence')
  return { root, cwd, git, revision, output }
}

const settings = f => ({ cwd: f.cwd, env: { ACCEPTANCE_OUTPUT_DIR: f.output } })

test('acceptance is manual-only, main-only, and has no automatic event', () => {
  assert.match(workflow, /on:\s*\n  workflow_dispatch:/)
  assert.doesNotMatch(workflow, /^  (push|pull_request|schedule|workflow_run|workflow_call):/m)
  assert.match(workflow, /GITHUB_REF.*refs\/heads\/main/)
  assert.match(workflow, /GITHUB_EVENT_NAME.*workflow_dispatch/)
})

test('acceptance workflow cannot write repository contents or retain Git credentials', () => {
  assert.match(workflow, /permissions:\n  contents: read/)
  assert.doesNotMatch(workflow, /:\s*(write|write-all)\b/)
  assert.match(workflow, /persist-credentials: false/)
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/)
  assert.doesNotMatch(workflow, /git (push|commit|add|checkout -b)|createRef|deploy-pages|releases\/|secrets\./)
})

test('artifacts have run-specific identity and upload even after a test failure', () => {
  assert.match(workflow, /production-acceptance-\$\{\{ github.run_id \}\}-\$\{\{ github.run_attempt \}\}/)
  assert.match(workflow, /if: \$\{\{ always\(\) \}\}/)
  assert.match(workflow, /actions\/upload-artifact@v7/)
  assert.match(workflow, /runner.temp/)
  assert.doesNotMatch(workflow, /continue-on-error:|\[skip ci\]|qa\/production-acceptance/)
})

test('harness keeps its real browser matrix, fingerprints and non-release scope', () => {
  assert.match(script, /prepareAcceptance\(\)/)
  assert.match(script, /fingerprint\(files, 'before'\)/)
  assert.match(script, /fingerprint\(files, 'after'\)/)
  assert.match(script, /expectedCases: 28/)
  assert.match(script, /expect\(result.requestsFailed/)
  assert.match(script, /physicalDevices: 'NOT YET VERIFIED'/)
  assert.match(script, /stableRelease: 'NOT AUTHORIZED BY THIS HARNESS'/)
  assert.doesNotMatch(script, /path\.resolve\('docs\/acceptance/)
})

test('default revision is the actual checked-out commit and output is outside the repository', t => {
  const f = fixture(t)
  const config = prepareAcceptance(settings(f))
  assert.equal(config.revision, f.revision)
  assert.equal(config.harnessRevision, f.revision)
  assert.equal(config.output, f.output)
  assert.equal(config.base, 'https://xuan2261.github.io/Rocket-Anatomy-Lab/')
  assert.equal(fs.statSync(config.output).isDirectory(), true)
  assert.equal(f.git('status', '--porcelain'), '')
})

test('an explicit full commit SHA is accepted without interpreting it as shell syntax', t => {
  const f = fixture(t)
  const config = prepareAcceptance({ ...settings(f), env: {
    ACCEPTANCE_OUTPUT_DIR: f.output, ACCEPTANCE_REVISION: f.revision.toUpperCase(),
  } })
  assert.equal(config.revision, f.revision)
})

test('branch names, short hashes, option injection and malformed revisions are rejected', t => {
  const f = fixture(t)
  for (const value of ['main', f.revision.slice(0, 7), '--help', '$(touch wrong)', 'a'.repeat(39), 'z'.repeat(40)]) {
    assert.throws(() => prepareAcceptance({ ...settings(f), env: {
      ACCEPTANCE_OUTPUT_DIR: f.output, ACCEPTANCE_REVISION: value,
    } }), /40 hexadecimal/)
  }
  assert.equal(fs.existsSync(f.output), false)
})

test('an unrelated commit is not an eligible production baseline', t => {
  const f = fixture(t)
  const unrelated = f.git('commit-tree', f.git('rev-parse', 'HEAD^{tree}'), '-m', 'unrelated')
  assert.throws(() => prepareAcceptance({ ...settings(f), env: {
    ACCEPTANCE_OUTPUT_DIR: f.output, ACCEPTANCE_REVISION: unrelated,
  } }), /ancestor/)
})

test('application source drift fails before any output is created', t => {
  const f = fixture(t)
  fs.writeFileSync(path.join(f.cwd, 'src/main.ts'), 'export const value = 2\n')
  assert.throws(() => prepareAcceptance(settings(f)), /Application source differs/)
  assert.equal(fs.existsSync(f.output), false)
})

test('existing evidence is never overwritten', t => {
  const f = fixture(t)
  fs.mkdirSync(f.output)
  fs.writeFileSync(path.join(f.output, 'results.json'), 'original')
  assert.throws(() => prepareAcceptance(settings(f)), /already exists/)
  assert.equal(fs.readFileSync(path.join(f.output, 'results.json'), 'utf8'), 'original')
})

test('repository paths, parent paths and symlink aliases are rejected as output', t => {
  const f = fixture(t)
  const alias = path.join(f.root, 'alias')
  fs.symlinkSync(f.cwd, alias, 'dir')
  for (const output of [f.cwd, f.root, path.join(f.cwd, 'new-results'), path.join(alias, 'new-results')]) {
    assert.throws(() => prepareAcceptance({ ...settings(f), env: { ACCEPTANCE_OUTPUT_DIR: output } }), /outside/)
  }
  assert.equal(fs.existsSync(path.join(f.cwd, 'new-results')), false)
})

test('GitHub execution requires the intended repository, manual event and exact main checkout', t => {
  const f = fixture(t)
  const env = { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'xuan2261/Rocket-Anatomy-Lab',
    GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_SHA: f.revision,
    ACCEPTANCE_OUTPUT_DIR: f.output }
  for (const changed of [{ GITHUB_REPOSITORY: 'other/repo' }, { GITHUB_REF: 'refs/heads/qa/test' },
    { GITHUB_EVENT_NAME: 'push' }, { GITHUB_SHA: 'a'.repeat(40) }]) {
    assert.throws(() => prepareAcceptance({ cwd: f.cwd, env: { ...env, ...changed } }), /GitHub/)
  }
  assert.equal(prepareAcceptance({ cwd: f.cwd, env }).revision, f.revision)
})

// Job-level env is evaluated before runner context exists. Keep runner paths
// in a run step or step-level with, where GitHub permits those variables.
test('runner temporary paths are resolved only after the job reaches a runner', () => {
  const jobEnv = workflow.match(/^    env:\n([\s\S]*?)^    steps:/m)?.[1]
  assert.ok(jobEnv)
  assert.doesNotMatch(jobEnv, /runner\./)
  assert.match(workflow, /\$RUNNER_TEMP/)
  assert.match(workflow, />> "\$GITHUB_ENV"/)
  assert.match(workflow, /path: \$\{\{ runner\.temp \}\}\/production-acceptance/)
})
