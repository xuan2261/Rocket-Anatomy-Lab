import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { qualifyPages, createGitHubReader } from './lib/pages-ci-gate.mjs'

try {
  const env = process.env
  const receipt = await qualifyPages({
    get: createGitHubReader(env.GH_TOKEN),
    context: {
      repository: env.GITHUB_REPOSITORY, ref: env.GITHUB_REF, sha: env.GITHUB_SHA,
      checkoutSha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      eventName: env.GITHUB_EVENT_NAME, event: JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, 'utf8')),
      expectedRunId: env.EXPECTED_CI_RUN_ID, expectedRunAttempt: env.EXPECTED_CI_RUN_ATTEMPT,
    },
  })
  if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT,
    `sha=${receipt.sha}\nci_run_id=${receipt.ciRunId}\nci_run_attempt=${receipt.ciRunAttempt}\n`)
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY,
    `## Pages CI gate: PASS\n\nCommit: \`${receipt.sha}\`\n\n` +
    `CI run: ${receipt.ciRunId}, attempt: ${receipt.ciRunAttempt}\n\n` +
    `Checked: ${receipt.checkedAt}\n\nAll required jobs and all returned CI jobs completed successfully.\n\n`)
  console.log(`PAGES_CI_GATE_PASS ${JSON.stringify(receipt)}`)
} catch (error) {
  // Error messages never contain request headers or token values.
  console.error(`PAGES_CI_GATE_BLOCKED: ${error.message}`)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    '## Pages CI gate: BLOCKED\n\nNo deployment approval. Inspect the gate log; do not bypass failed or incomplete CI.\n')
  process.exitCode = 1
}
