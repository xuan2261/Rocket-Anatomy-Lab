import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8')
const workflow = read('.github/workflows/real-device.yml')
const bstack = read('browserstack.yml')
const coreConfig = read('playwright.config.mjs')
const config = read('playwright.real-device.config.mjs')
const spec = read('e2e/real-device.spec.mjs')
const physical = read('docs/PHYSICAL_DEVICE_ACCEPTANCE.md')

test('real-device workflow is post-Pages, opt-in and fail-closed on secrets and evidence', () => {
  assert.match(workflow, /workflow_run:[\s\S]*Deploy GitHub Pages/)
  assert.match(workflow, /REAL_DEVICE_CI_ENABLED/)
  assert.match(workflow, /needs\.preflight\.outputs\.enabled == 'true'/)
  assert.match(workflow, /Missing BROWSERSTACK_USERNAME secret/)
  assert.match(workflow, /Missing BROWSERSTACK_ACCESS_KEY secret/)
  assert.match(workflow, /git ls-remote origin refs\/heads\/main/)
  assert.match(workflow, /@playwright\/test@1\.59\.1/)
  assert.match(workflow, /playwright@1\.59\.1/)
  assert.match(workflow, /browserstack-node-sdk@1\.71\.2/)
  assert.match(workflow, /npx --no-install browserstack-node-sdk/)
  assert.match(workflow, /Unexpected @playwright\/test version/)
  assert.match(workflow, /createHash\('sha256'\)/)
  assert.match(workflow, /hash\('browserstack\.yml'\)/)
  assert.match(workflow, /hash\('playwright\.real-device\.config\.mjs'\)/)
  assert.match(workflow, /hash\('e2e\/real-device\.spec\.mjs'\)/)
  assert.match(workflow, /if-no-files-found: error/)
  assert.doesNotMatch(workflow, /browserstack-node-sdk@latest|@playwright\/test@latest|playwright@latest/)
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

test('core Playwright suite excludes the real-device-only spec', () => {
  assert.match(coreConfig, /testIgnore: 'real-device\.spec\.mjs'/)
  assert.match(config, /testMatch: 'real-device\.spec\.mjs'/)
})

test('real-device test binds to live Pages and captures stronger physical-runtime evidence without overclaiming unsupported lanes', () => {
  assert.match(config, /REAL_DEVICE_BASE_URL/)
  assert.match(spec, /data-state', 'assembly'/)
  assert.match(spec, /getContext\('webgl2'\)/)
  assert.match(spec, /\.tap\(\)/)
  assert.match(spec, /page\.reload\(\{ waitUntil: 'domcontentloaded' \}\)/)
  assert.match(spec, /screen\.orientation\?\.type/)
  assert.match(spec, /UNMASKED_RENDERER_WEBGL/)
  assert.match(spec, /#sectionToggleBtn/)
  assert.match(spec, /aria-pressed', 'true'/)
  assert.match(spec, /#paneHelp/)
  assert.match(spec, /page\.screenshot\(\)/)
  assert.match(spec, /real-device-final-state/)
  assert.match(spec, /EXPECTED_REVISION/)
  assert.match(physical, /Status: \*\*NOT YET VERIFIED\*\*/)
})
