import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { qualifyPages, createGitHubReader, REQUIRED_JOBS } from '../scripts/lib/pages-ci-gate.mjs'

const REPO = 'xuan2261/Rocket-Anatomy-Lab'
const SHA = 'a'.repeat(40)
const OTHER = 'b'.repeat(40)
const workflow = { id: 100, name: 'CI', path: '.github/workflows/ci.yml', state: 'active' }
const run = () => ({ id: 200, run_number: 20, run_attempt: 1, workflow_id: 100, name: 'CI',
  path: '.github/workflows/ci.yml', event: 'push', head_branch: 'main', head_sha: SHA,
  repository: { full_name: REPO }, head_repository: { full_name: REPO }, status: 'completed', conclusion: 'success' })
function fixture(changes = {}) {
  const state = { workflow: structuredClone(workflow), run: run(), main: SHA,
    jobs: REQUIRED_JOBS.map((name, index) => ({ id: index + 1, name, run_id: 200,
      head_sha: SHA, status: 'completed', conclusion: 'success' })), ...changes }
  const calls = []
  const get = async endpoint => {
    calls.push(endpoint)
    if (endpoint === '/actions/workflows/ci.yml') return structuredClone(state.workflow)
    if (endpoint === '/git/ref/heads/main') return { ref: 'refs/heads/main', object: { type: 'commit', sha: state.main } }
    if (endpoint.startsWith('/actions/workflows/ci.yml/runs?')) {
      const runs = state.runs ?? [state.run]
      return { total_count: runs.length, workflow_runs: structuredClone(runs) }
    }
    if (endpoint === '/actions/runs/200') return structuredClone(state.run)
    if (endpoint === '/actions/runs/200/jobs?filter=latest&per_page=100') {
      return { total_count: state.jobTotal ?? state.jobs.length, jobs: structuredClone(state.jobs) }
    }
    throw new Error(`Unexpected GET ${endpoint}`)
  }
  const context = { repository: REPO, ref: 'refs/heads/main', sha: SHA, checkoutSha: SHA,
    eventName: 'workflow_run', event: { action: 'completed', workflow_run: run() } }
  return { state, get, calls, context }
}
const check = f => qualifyPages({ get: f.get, context: f.context })

test('a successful trusted CI approves only its exact SHA/run/attempt', async () => {
  const f = fixture(); const result = await check(f)
  assert.equal(result.sha, SHA); assert.equal(result.ciRunId, 200); assert.equal(result.ciRunAttempt, 1)
  assert.equal(result.jobs.length, REQUIRED_JOBS.length)
  assert.equal(f.calls.filter(x => x === '/git/ref/heads/main').length, 2)
  assert.equal(f.calls.filter(x => x === '/actions/runs/200').length, 2)
})
test('manual deployment must use the same gate, not an override', async () => {
  const f = fixture(); f.context.eventName = 'workflow_dispatch'; f.context.event = {}
  assert.equal((await check(f)).sha, SHA)
  f.state.run.conclusion = 'failure'
  await assert.rejects(check(f), /CI_NOT_GREEN/)
})
for (const conclusion of ['failure', 'cancelled', 'skipped', 'neutral', 'timed_out', null]) {
  test(`CI conclusion ${conclusion} blocks deployment`, async () => {
    const f = fixture(); f.state.run.conclusion = conclusion
    await assert.rejects(check(f), /CI_NOT_GREEN/)
  })
}
for (const status of ['queued', 'in_progress', 'waiting']) {
  test(`unfinished CI ${status} blocks deployment`, async () => {
    const f = fixture(); f.state.run.status = status
    await assert.rejects(check(f), /CI_NOT_GREEN/)
  })
}
test('no matching CI fails closed', async () => {
  await assert.rejects(check(fixture({ runs: [] })), /CI_NOT_FOUND/)
})
test('latest CI is selected without filtering out failing or pending runs', async () => {
  const f = fixture(); f.context.eventName = 'workflow_dispatch'; f.context.event = {}
  f.state.run.status = 'queued'; f.state.run.conclusion = null
  f.state.runs = [{ ...run(), id: 199, run_number: 19 }, f.state.run]
  await assert.rejects(check(f), /CI_NOT_GREEN/)
  assert.ok(f.calls.some(x => x.includes('head_sha=') && !x.includes('status=success')))
})
for (const [key, value] of [['head_sha', OTHER], ['head_branch', 'other'], ['event', 'pull_request'],
  ['workflow_id', 999], ['path', '.github/workflows/other.yml'], ['name', 'Fake CI'],
  ['head_repository', { full_name: 'fork/repo' }], ['repository', { full_name: 'other/repo' }]]) {
  test(`wrong CI identity ${key} is rejected`, async () => {
    const f = fixture(); f.state.run[key] = value
    await assert.rejects(check(f), /CI_IDENTITY/)
  })
}
test('a superseded commit cannot be deployed', async () => {
  await assert.rejects(check(fixture({ main: OTHER })), /STALE_MAIN/)
})
test('a stale checkout or non-main manual ref cannot qualify', async () => {
  for (const change of [{ checkoutSha: OTHER }, { ref: 'refs/heads/topic' }, { repository: 'fork/repo' },
    { sha: '--help' }, { eventName: 'push' }]) {
    const f = fixture(); Object.assign(f.context, change)
    await assert.rejects(check(f), /CONTEXT/)
  }
})
test('forged, stale, failed or PR-origin workflow_run events cannot qualify', async () => {
  for (const change of [{ id: 199 }, { run_attempt: 2 }, { conclusion: 'failure' },
    { event: 'pull_request' }, { head_repository: { full_name: 'fork/repo' } }]) {
    const f = fixture(); Object.assign(f.context.event.workflow_run, change)
    await assert.rejects(check(f), /EVENT/)
  }
})
for (const status of ['failure', 'skipped', 'cancelled']) {
  test(`one ${status} job rejects an otherwise green run summary`, async () => {
    const f = fixture(); f.state.jobs[3].conclusion = status
    await assert.rejects(check(f), /JOBS_NOT_GREEN/)
  })
}
test('missing, duplicate or incomplete job evidence is rejected', async () => {
  for (const change of [f => f.state.jobs.pop(), f => f.state.jobs.push({ ...f.state.jobs[0] }),
    f => { f.state.jobTotal = 101 }, f => { f.state.jobs[0].head_sha = OTHER },
    f => { f.state.jobs[0].run_id = 999 }, f => { f.state.jobs[0].status = 'in_progress' }]) {
    const f = fixture(); change(f)
    await assert.rejects(check(f), /JOBS/)
  }
})
test('a new failed job cannot be hidden by the required-name allowlist', async () => {
  const f = fixture(); f.state.jobs.push({ ...f.state.jobs[0], id: 9, name: 'New check', conclusion: 'failure' })
  await assert.rejects(check(f), /JOBS_NOT_GREEN/)
})
test('a newer run arriving during the gate revokes approval', async () => {
  const f = fixture(); let lists = 0; const base = f.get
  f.get = endpoint => {
    if (endpoint.startsWith('/actions/workflows/ci.yml/runs?') && ++lists === 2) {
      f.state.runs = [f.state.run, { ...run(), id: 201, run_number: 21 }]
    }
    return base(endpoint)
  }
  await assert.rejects(check(f), /CI_CHANGED/)
})
test('a new main tip or CI rerun during the gate revokes approval', async () => {
  for (const mutate of [f => { f.state.main = OTHER }, f => { f.state.run.run_attempt = 2 }]) {
    const f = fixture(); const base = f.get
    f.get = async endpoint => {
      const result = await base(endpoint)
      if (endpoint.includes('/jobs?')) mutate(f)
      return result
    }
    await assert.rejects(check(f), /STALE_MAIN|CI_CHANGED/)
  }
})
test('pre-deploy recheck is bound to the run and attempt admitted before build', async () => {
  const f = fixture(); f.context.expectedRunId = '199'; f.context.expectedRunAttempt = '1'
  await assert.rejects(check(f), /CI_CHANGED/)
})
test('HTTP errors and malformed API evidence fail closed', async () => {
  const f = fixture(); f.get = async () => { throw new Error('HTTP 403') }
  await assert.rejects(check(f), /HTTP 403/)
  f.get = async () => ({})
  await assert.rejects(check(f), /WORKFLOW_IDENTITY/)
})
test('reader uses only official HTTPS GET endpoints and rejects redirects/errors', async () => {
  const calls = []
  const get = createGitHubReader('test-token', async (url, options) => {
    calls.push({ url, options }); return { ok: true, json: async () => ({ ok: true }) }
  })
  await get('/git/ref/heads/main')
  assert.equal(calls[0].url, `https://api.github.com/repos/${REPO}/git/ref/heads/main`)
  assert.equal(calls[0].options.method, 'GET'); assert.equal(calls[0].options.redirect, 'error')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token')
  await assert.rejects(get('https://other.invalid'), /API_PATH/)
  const bad = createGitHubReader('test-token', async () => ({ ok: false, status: 403 }))
  await assert.rejects(bad('/git/ref/heads/main'), /HTTP 403/)
})

const pages = fs.readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8')
const block = id => pages.match(new RegExp(`^  ${id}:\\n([\\s\\S]*?)(?=^  [\\w-]+:|$(?![\\s\\S]))`, 'm'))?.[1] ?? ''
test('Pages is triggered only by completed main CI or gated manual invocation', () => {
  assert.match(pages, /workflow_run:\n    workflows: \[CI\]\n    types: \[completed\]\n    branches: \[main\]/)
  assert.match(pages, /workflow_dispatch:/); assert.doesNotMatch(pages, /^  (push|pull_request):/m)
  assert.match(block('gate'), /workflow_run\.event == 'push'/)
  assert.match(block('gate'), /workflow_run\.conclusion == 'success'/)
  assert.match(block('gate'), /head_repository\.full_name/)
  assert.match(block('gate'), /node scripts\/check-pages-ci\.mjs/)
})
test('both deployment boundaries run the exact same fail-closed checker', () => {
  assert.match(block('promote'), /needs: gate/)
  assert.match(block('deploy'), /needs: \[gate, promote\]/)
  assert.match(block('deploy'), /EXPECTED_CI_RUN_ID:/)
  assert.match(block('deploy'), /EXPECTED_CI_RUN_ATTEMPT:/)
  assert.match(block('deploy'), /node scripts\/check-pages-ci\.mjs[\s\S]*uses: actions\/deploy-pages@v5/)
  assert.doesNotMatch(block('deploy'), /continue-on-error|always\(\)/)
})
test('write privileges are restricted to the deploy job and all checkouts are pinned', () => {
  assert.doesNotMatch(pages.split('jobs:')[0], /:\s*write\b/)
  assert.doesNotMatch(block('gate') + block('promote') + block('smoke'), /:\s*write\b/)
  assert.match(block('deploy'), /pages: write/); assert.match(block('deploy'), /id-token: write/)
  for (const id of ['gate', 'promote', 'deploy', 'smoke']) {
    assert.match(block(id), /persist-credentials: false/)
    assert.match(block(id), /ref: \$\{\{ (github.sha|needs\.(gate|deploy)\.outputs\.sha) \}\}/)
  }
  assert.match(pages, /cancel-in-progress: false/)
  assert.match(block('promote'), /name: github-pages-\$\{\{ needs.gate.outputs.sha \}\}/)
  assert.match(block('deploy'), /artifact_name: github-pages-\$\{\{ needs.gate.outputs.sha \}\}/)
})
