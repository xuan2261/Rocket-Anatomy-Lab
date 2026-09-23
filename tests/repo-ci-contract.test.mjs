import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('verify:ci builds compiled core before fetching qualified source asset', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const command = pkg.scripts['verify:ci']
  assert.ok(command, 'verify:ci script must exist')
  const buildIndex = command.indexOf('npm run build')
  const fetchIndex = command.indexOf('npm run fetch:source')
  assert.ok(buildIndex >= 0, 'verify:ci must build TypeScript output')
  assert.ok(fetchIndex >= 0, 'verify:ci must fetch the official source asset')
  assert.ok(buildIndex < fetchIndex, 'build must run before fetch:source on a clean checkout')
})
