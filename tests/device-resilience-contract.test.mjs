import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')
const helper = read('scripts/lib/device-resilience.mjs')
const e2e = read('e2e/device-resilience.spec.mjs')
const acceptance = read('scripts/accept-production.mjs')
const testing = read('docs/TESTING.md')
const physical = read('docs/PHYSICAL_DEVICE_ACCEPTANCE.md')
const pkg = JSON.parse(read('package.json'))

test('release-gated E2E owns WebGL recovery, reduced motion, orientation and pinch coverage', () => {
  assert.equal(pkg.scripts['test:device-resilience'], 'playwright test e2e/device-resilience.spec.mjs')
  assert.match(pkg.scripts['check:modules'], /scripts\/lib\/device-resilience\.mjs/)
  for (const token of ['assertReducedMotion', 'exerciseWebglContextRecovery', 'exerciseViewportOrientation', 'exercisePinchZoom']) {
    assert.ok(e2e.includes(token), token)
  }
  assert.match(helper, /WEBGL_lose_context/)
  assert.match(helper, /Input\.dispatchTouchEvent/)
  assert.match(helper, /page\.setViewportSize/)
})

test('production acceptance adds resilience cases without claiming physical-device verification', () => {
  assert.match(acceptance, /runCase\(profile, language, 'resilience'/)
  assert.match(acceptance, /expectedCases: 32/)
  assert.match(acceptance, /report\.cases\.length === 32/)
  assert.match(acceptance, /physicalDevices: 'NOT YET VERIFIED'/)
  assert.match(acceptance, /No physical Android\/iOS, GPU\/driver or assistive-technology sign-off/)
})

test('documentation separates browser emulation from physical Android iOS GPU and assistive-tech evidence', () => {
  assert.match(testing, /PHYSICAL_DEVICE_ACCEPTANCE\.md/)
  assert.match(physical, /Status: \*\*NOT YET VERIFIED\*\*/)
  for (const token of ['Android', 'iOS', 'GPU', 'TalkBack', 'VoiceOver', 'portrait', 'landscape', 'pinch']) {
    assert.ok(physical.includes(token), token)
  }
  assert.doesNotMatch(physical, /Status: \*\*EXECUTION PASS\*\*/)
})
