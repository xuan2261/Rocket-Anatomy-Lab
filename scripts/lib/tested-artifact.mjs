const positive = value => Number.isSafeInteger(value) && value > 0
const requireThat = (condition, reason) => { if (!condition) throw new Error(reason) }

// A successful CI alone is insufficient: resolve the unique immutable payload
// from that exact run/attempt. Never accept an artifact by name across runs.
export async function selectTestedArtifact(get, receipt) {
  const { sha, ciRunId, ciRunAttempt } = receipt
  requireThat(/^[a-f0-9]{40}$/.test(sha ?? '') && positive(ciRunId) && positive(ciRunAttempt), 'ARTIFACT_CONTEXT_REJECTED')
  const name = `tested-site-${sha}-${ciRunId}-${ciRunAttempt}`
  const list = await get(`/actions/runs/${ciRunId}/artifacts?name=${name}&per_page=100`)
  requireThat(list?.total_count === 1 && Array.isArray(list.artifacts) && list.artifacts.length === 1,
    'TESTED_ARTIFACT_MISSING_OR_AMBIGUOUS')
  const artifact = list.artifacts[0]
  requireThat(positive(artifact?.id) && artifact.name === name && artifact.expired === false &&
    positive(artifact.size_in_bytes) && artifact.size_in_bytes <= 1024 * 1024 * 1024 &&
    /^sha256:[a-f0-9]{64}$/.test(artifact.digest ?? '') && artifact.workflow_run?.id === ciRunId &&
    artifact.workflow_run?.head_sha === sha && artifact.workflow_run?.head_branch === 'main' &&
    positive(artifact.workflow_run?.repository_id) &&
    artifact.workflow_run.repository_id === artifact.workflow_run.head_repository_id, 'TESTED_ARTIFACT_REJECTED')
  return { id: artifact.id, name, digest: artifact.digest, bytes: artifact.size_in_bytes }
}
