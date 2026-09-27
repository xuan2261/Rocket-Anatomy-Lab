import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8')
const config = read('playwright.device-matrix.config.mjs')
const spec = read('e2e/device-matrix.spec.mjs')
const workflow = read('.github/workflows/ci.yml')
const artifact = read('scripts/site_artifact.py')
const testing = read('docs/TESTING.md')
const physical = read('docs/PHYSICAL_DEVICE_ACCEPTANCE.md')
const pkg = JSON.parse(read('package.json'))

const lanes = [
  'desktop-firefox',
  'desktop-webkit',
  'android-chromium',
  'iphone-webkit',
]

test('device matrix defines Firefox WebKit Android and iPhone emulation without replacing the core Chromium suite', () => {
  assert.equal(pkg.scripts['test:device-matrix'], 'playwright test e2e/device-matrix.spec.mjs --config playwright.device-matrix.config.mjs')
  for (const token of ['Desktop Firefox', 'Desktop Safari', 'Pixel 7', 'iPhone 13']) assert.ok(config.includes(token), token)
  assert.match(spec, /exerciseViewportOrientation/)
  assert.match(spec, /locator\.tap\(\)/)
  assert.match(spec, /canvas\.getContext\('webgl2'\)/)
})

test('CI gates artifact publication on every device-matrix lane and exact-candidate byte proof', () => {
  assert.match(workflow, /device-matrix:/)
  assert.match(workflow, /fail-fast: false/)
  assert.match(workflow, /needs: \[verify, e2e, visual, device-matrix\]/)
  assert.match(workflow, /Download this CI attempt's exact candidate/)
  assert.match(workflow, /xvfb-run -a npm run test:device-matrix/)
  assert.match(workflow, /LIBGL_ALWAYS_SOFTWARE=1/)
  assert.match(config, /headless: false/)
  assert.match(config, /webgl\.force-enabled/)
  assert.match(workflow, /site_artifact\.py proof "\$\{\{ matrix\.lane \}\}"/)
  for (const lane of lanes) {
    assert.ok(workflow.includes('lane: ' + lane), lane)
    assert.ok(artifact.includes("'" + lane + "'"), lane)
  }
})

test('documentation keeps emulation and WebKit distinct from physical Safari Android iOS and assistive-tech evidence', () => {
  assert.match(testing, /Cross-browser device matrix/)
  assert.match(testing, /WebKit.*không phải branded Safari/i)
  assert.match(physical, /CI cross-browser\/device preflight/)
  assert.match(physical, /Status: \*\*NOT YET VERIFIED\*\*/)
  assert.doesNotMatch(physical, /Status: \*\*EXECUTION PASS\*\*/)
})
