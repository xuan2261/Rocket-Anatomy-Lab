import test from 'node:test'
import assert from 'node:assert/strict'
import { selectTestedArtifact } from '../scripts/lib/tested-artifact.mjs'

const sha = 'a'.repeat(40)
const receipt = { sha, ciRunId: 200, ciRunAttempt: 1 }
const sample = () => ({ id: 300, name: `tested-site-${sha}-200-1`, expired: false, size_in_bytes: 100,
  digest: `sha256:${'b'.repeat(64)}`,
  workflow_run: { id: 200, head_sha: sha, head_branch: 'main', repository_id: 123, head_repository_id: 123 } })
const qualify = value => selectTestedArtifact(async () => value, receipt)

test('release selection uses exact source run, attempt, name and immutable ID', async () => {
  const calls = []
  const result = await selectTestedArtifact(async endpoint => {
    calls.push(endpoint); return { total_count: 1, artifacts: [sample()] }
  }, receipt)
  assert.equal(result.id, 300)
  assert.deepEqual(calls, [`/actions/runs/200/artifacts?name=tested-site-${sha}-200-1&per_page=100`])
})
for (const [key, value] of [['name', 'old-artifact'], ['expired', true], ['digest', null],
  ['size_in_bytes', 0], ['id', -1], ['workflow_run', { ...sample().workflow_run, id: 199 }],
  ['workflow_run', { ...sample().workflow_run, head_sha: 'c'.repeat(40) }],
  ['workflow_run', { ...sample().workflow_run, head_branch: 'topic' }],
  ['workflow_run', { ...sample().workflow_run, head_repository_id: 456 }]]) {
  test(`invalid artifact metadata ${key} is blocked`, async () => {
    await assert.rejects(qualify({ total_count: 1, artifacts: [{ ...sample(), [key]: value }] }), /ARTIFACT_REJECTED/)
  })
}
test('missing, duplicate or truncated artifact results block instead of choosing the first match', async () => {
  for (const list of [{ total_count: 0, artifacts: [] }, { total_count: 2, artifacts: [sample(), sample()] },
    { total_count: 2, artifacts: [sample()] }, {}, { total_count: 1, artifacts: [] }]) {
    await assert.rejects(qualify(list), /MISSING_OR_AMBIGUOUS/)
  }
})
test('new CI attempts cannot reuse an artifact from the previous attempt', async () => {
  await assert.rejects(selectTestedArtifact(async () => ({ total_count: 1, artifacts: [sample()] }),
    { ...receipt, ciRunAttempt: 2 }), /ARTIFACT_REJECTED/)
})
test('the API error is not treated as an optional artifact', async () => {
  await assert.rejects(selectTestedArtifact(async () => { throw new Error('HTTP 403') }, receipt), /403/)
})
