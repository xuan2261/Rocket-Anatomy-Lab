import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

// These strings are never workflow files. They guard the integration against the
// actual configuration mistakes previously seen in this repository.
const binary = process.argv[2]
assert.ok(binary, 'Usage: node scripts/check-actionlint-fixtures.mjs /path/to/actionlint')
const base = `name: Probe
on: workflow_dispatch
permissions:
  contents: read
jobs:
  check:
    runs-on: ubuntu-24.04
    steps:
      - run: echo ok
`
const fixtures = [
  { name: 'valid-minimal-workflow', yaml: base, status: 0 },
  { name: 'valid-runner-context-in-step', status: 0,
    yaml: base.replace('      - run: echo ok', '      - run: echo "$TEMP_PATH"\n        env:\n          TEMP_PATH: ${{ runner.temp }}') },
  { name: 'reject-unquoted-colon-in-condition', status: 1, diagnostic: /syntax|mapping|yaml/i,
    yaml: base.replace('    runs-on:', "    if: github.event.head_commit.message == 'ci: verify'\n    runs-on:") },
  { name: 'reject-runner-context-in-job-env', status: 1, diagnostic: /runner|context/i,
    yaml: base.replace('    steps:', '    env:\n      TEMP_PATH: ${{ runner.temp }}\n    steps:') },
  { name: 'reject-invalid-permission-scope', status: 1, diagnostic: /permission/i,
    yaml: base.replace('contents: read', 'contentz: read') },
  { name: 'reject-unknown-expression-property', status: 1, diagnostic: /not_a_field|property/i,
    yaml: base.replace('echo ok', "echo '${{ runner.not_a_field }}'") },
  { name: 'reject-missing-job-dependency', status: 1, diagnostic: /needs|depend|no_such_job/i,
    yaml: base.replace('    steps:', '    needs: no_such_job\n    steps:') },
]
for (const fixture of fixtures) {
  const result = spawnSync(binary, ['-oneline', '-no-color', '-shellcheck=', '-pyflakes=', '-'], {
    input: fixture.yaml, encoding: 'utf8', timeout: 5000,
  })
  assert.equal(result.error, undefined, `${fixture.name}: linter must actually execute`)
  const output = result.stdout + result.stderr
  assert.equal(result.status, fixture.status, `${fixture.name}: ${output}`)
  if (fixture.diagnostic) assert.match(output, fixture.diagnostic, fixture.name)
  console.log(`ACTIONLINT_FIXTURE_PASS ${fixture.name}`)
}
console.log(`ACTIONLINT_FIXTURES_SUMMARY ${JSON.stringify({ passed: fixtures.length, failed: 0 })}`)
