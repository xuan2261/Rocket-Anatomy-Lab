import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8')
const workflow = read('.github/workflows/real-device.yml')
const bstack = read('browserstack.yml')
const config = read('playwright.real-device.config.mjs')
const spec = read('e2e/real-device.spec.mjs')
const physical = read('docs/PHYSICAL_DEVICE_ACCEPTANCE.md')

test('real-device workflow is post-Pages, opt-in and fail-closed on secrets', () => {
  assert.match(workflow, /workflow_run:[\s\S]*Deploy GitHub Pages/)
  assert.match(workflow, /REAL_DEVICE_CI_ENABLED/)
  assert.match(workflow, /needs\.preflight\.outputs\.enabled == 'true'/)
  assert.match(workflow, /Missing BROWSERSTACK_USERNAME secret/)
  assert.match(workflow, /Missing BROWSERSTACK_ACCESS_KEY secret/)
  assert.match(workflow, /git ls-remote origin refs\/heads\/main/)
  assert.match(workflow, /browserstack-node-sdk@1\.71\.2/)
  assert.doesNotMatch(workflow, /^  (push|pull_request):/m)
  assert.doesNotMatch(workflow, /setup-local|browserstackLocal:\s*true/)
})

test('BrowserStack config requests real Android Chrome and real iOS Safari without committed credentials', () => {
  assert.match(bstack, /browserName: chrome[\s\S]*deviceName: Samsung Galaxy S25 Ultra/)
  assert.match(bstack, /browserName: safari[\s\S]*deviceName: iPhone 15 Pro Max/)
  assert.match(bstack, /browserStackLocal: false/)
  assert.doesNotMatch(bstack, /^userName:|^accessKey:/m)
  assert.doesNotMatch(bstack, /YOUR_USERNAME|YOUR_ACCESS_KEY/)
})

test('real-device test binds to live Pages and proves WebGL plus touch interaction without claiming screen-reader coverage', () => {
  assert.match(config, /REAL_DEVICE_BASE_URL/)
  assert.match(spec, /data-state', 'assembly'/)
  assert.match(spec, /getContext\('webgl2'\)/)
  assert.match(spec, /\.tap\(\)/)
  assert.match(spec, /EXPECTED_REVISION/)
  assert.match(physical, /Status: \*\*NOT YET VERIFIED\*\*/)
})
