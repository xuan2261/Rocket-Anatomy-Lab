const REPOSITORY = 'xuan2261/Rocket-Anatomy-Lab'
const CI_PATH = '.github/workflows/ci.yml'
export const REQUIRED_JOBS = Object.freeze([
  'Workflow lint (actionlint)', 'Build + unit/integration (22)', 'Build + unit/integration (24)',
  'E2E + accessibility Chromium', 'Visual regression', 'Publish tested artifact',
])
const positiveInteger = value => Number.isSafeInteger(value) && value > 0
const requireThat = (condition, reason) => { if (!condition) throw new Error(reason) }

// Pure policy around an injected, read-only GitHub client. Fail closed on missing,
// truncated, stale or unsuccessful evidence; a manual run has no bypass path.
export async function qualifyPages({ get, context }) {
  const { sha, eventName, event } = context
  requireThat(context.repository === REPOSITORY && context.ref === 'refs/heads/main' &&
    /^[a-f0-9]{40}$/.test(sha ?? '') && context.checkoutSha === sha &&
    ['workflow_run', 'workflow_dispatch'].includes(eventName), 'CONTEXT_REJECTED')
  const workflow = await get('/actions/workflows/ci.yml')
  requireThat(positiveInteger(workflow?.id) && workflow.path === CI_PATH &&
    workflow.name === 'CI' && workflow.state === 'active', 'WORKFLOW_IDENTITY_REJECTED')
  const assertMain = data => requireThat(data?.ref === 'refs/heads/main' &&
    data.object?.type === 'commit' && data.object.sha === sha, 'STALE_MAIN')
  const assertIdentity = candidate => requireThat(positiveInteger(candidate?.id) &&
    positiveInteger(candidate.run_number) && positiveInteger(candidate.run_attempt) &&
    candidate.workflow_id === workflow.id && candidate.path === CI_PATH && candidate.name === 'CI' &&
    candidate.event === 'push' && candidate.head_branch === 'main' && candidate.head_sha === sha &&
    candidate.repository?.full_name === REPOSITORY && candidate.head_repository?.full_name === REPOSITORY,
  'CI_IDENTITY_REJECTED')
  const assertGreen = candidate => {
    assertIdentity(candidate)
    requireThat(candidate.status === 'completed' && candidate.conclusion === 'success', 'CI_NOT_GREEN')
  }
  const listEndpoint = `/actions/workflows/ci.yml/runs?branch=main&event=push&head_sha=${sha}&per_page=100`
  const latestRun = data => {
    requireThat(Array.isArray(data?.workflow_runs) && Number.isSafeInteger(data.total_count) &&
      data.total_count <= 100 && data.total_count === data.workflow_runs.length, 'CI_LIST_INCOMPLETE')
    requireThat(data.total_count > 0, 'CI_NOT_FOUND')
    for (const item of data.workflow_runs) assertIdentity(item)
    return [...data.workflow_runs].sort((a, b) => b.run_number - a.run_number || b.id - a.id)[0]
  }
  await get('/git/ref/heads/main').then(assertMain)
  // Never filter by success: an older green run must not hide a newer red run.
  const latest = latestRun(await get(listEndpoint))
  const run = await get(`/actions/runs/${latest.id}`)
  assertGreen(run)
  requireThat(run.id === latest.id && run.run_number === latest.run_number &&
    run.run_attempt === latest.run_attempt, 'CI_CHANGED')
  if (eventName === 'workflow_run') {
    const trigger = event?.workflow_run
    requireThat(event?.action === 'completed' && trigger?.id === run.id &&
      trigger.run_attempt === run.run_attempt && trigger.workflow_id === workflow.id &&
      trigger.head_sha === sha && trigger.head_branch === 'main' && trigger.event === 'push' &&
      trigger.head_repository?.full_name === REPOSITORY && trigger.status === 'completed' &&
      trigger.conclusion === 'success', 'EVENT_REJECTED')
  }
  if (context.expectedRunId !== undefined || context.expectedRunAttempt !== undefined) {
    requireThat(String(run.id) === context.expectedRunId &&
      String(run.run_attempt) === context.expectedRunAttempt, 'CI_CHANGED_SINCE_BUILD')
  }
  // filter=latest includes the latest result of every job, including successful
  // jobs reused by GitHub when only failed jobs are rerun. Do not mix raw attempts.
  const evidence = await get(`/actions/runs/${run.id}/jobs?filter=latest&per_page=100`)
  requireThat(Array.isArray(evidence?.jobs) && evidence.total_count === evidence.jobs.length &&
    evidence.total_count > 0 && evidence.total_count <= 100, 'JOBS_INCOMPLETE')
  const jobs = evidence.jobs
  requireThat(jobs.every(job => positiveInteger(job.id) && job.run_id === run.id &&
    job.head_sha === sha && job.status === 'completed' && job.conclusion === 'success'), 'JOBS_NOT_GREEN')
  requireThat(new Set(jobs.map(job => job.id)).size === jobs.length &&
    REQUIRED_JOBS.every(name => jobs.filter(job => job.name === name).length === 1), 'JOBS_REQUIRED_MISSING_OR_DUPLICATE')
  // Re-read mutable identities after collecting evidence. The deploy job calls
  // this checker again immediately before handing the artifact to deploy-pages.
  const refreshed = await get(`/actions/runs/${run.id}`)
  requireThat(refreshed?.id === run.id && refreshed.run_attempt === run.run_attempt, 'CI_CHANGED')
  assertGreen(refreshed)
  const finalLatest = latestRun(await get(listEndpoint))
  requireThat(finalLatest.id === run.id && finalLatest.run_attempt === run.run_attempt, 'CI_CHANGED')
  assertGreen(finalLatest)
  await get('/git/ref/heads/main').then(assertMain)
  return { sha, ciRunId: run.id, ciRunAttempt: run.run_attempt, workflowId: workflow.id,
    checkedAt: new Date().toISOString(), jobs: jobs.map(({ id, name }) => ({ id, name })) }
}

export function createGitHubReader(token, fetchImpl = fetch) {
  requireThat(typeof token === 'string' && token.length > 0, 'TOKEN_UNAVAILABLE')
  return async endpoint => {
    requireThat(typeof endpoint === 'string' && endpoint.startsWith('/') &&
      !endpoint.startsWith('//') && !endpoint.includes('..') && !/[\\\s]/.test(endpoint), 'API_PATH_REJECTED')
    const response = await fetchImpl(`https://api.github.com/repos/${REPOSITORY}${endpoint}`, {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(20_000),
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'rocket-pages-ci-gate' },
    })
    requireThat(response.ok, `GitHub gate HTTP ${response.status}`)
    return response.json()
  }
}
