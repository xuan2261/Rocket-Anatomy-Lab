import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const ci = fs.readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')
const pages = fs.readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8')
const a11y = fs.readFileSync(new URL('../e2e/accessibility.spec.mjs', import.meta.url), 'utf8')
const visual = fs.readFileSync(new URL('../e2e/visual.spec.mjs', import.meta.url), 'utf8')
const smoke = fs.readFileSync(new URL('../scripts/smoke-deployed.mjs', import.meta.url), 'utf8')
const snapshotDir = new URL('../e2e/visual.spec.mjs-snapshots/', import.meta.url)

test('Phase 7 pins axe and exposes explicit quality commands', () => {
  assert.equal(packageJson.devDependencies['@axe-core/playwright'], '4.13.0')
  assert.match(packageJson.scripts['test:a11y'], /accessibility\.spec\.mjs/)
  assert.match(packageJson.scripts['test:visual'], /visual\.spec\.mjs/)
  assert.match(packageJson.scripts['verify:phase7'], /verify:phase6/)
  assert.match(packageJson.scripts['verify:ci'], /verify:phase7/)
  assert.match(packageJson.scripts['test:all'], /test:visual/)
})

test('accessibility suite covers WCAG A/AA and both interface languages', () => {
  for (const tag of ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']) assert.match(a11y, new RegExp(tag))
  assert.match(a11y, /\['vi', 'en'\]/)
  assert.match(a11y, /AxeBuilder/)
  assert.match(a11y, /violations/)
})

test('visual suite stabilizes motion and masks WebGL-only variability', () => {
  assert.match(visual, /@visual/)
  assert.match(visual, /reducedMotion:\s*'reduce'/)
  assert.match(visual, /#viewport/)
  assert.match(visual, /#annotationLayer/)
  assert.match(visual, /toHaveScreenshot/)
})

test('CI has a pinned-environment visual regression lane', () => {
  assert.match(ci, /name: Visual regression/)
  assert.match(ci, /runs-on: ubuntu-24\.04/)
  assert.match(ci, /name: Visual regression[\s\S]*npm run verify:ci[\s\S]*npm run test:visual/)
  assert.match(ci, /name: E2E \+ accessibility Chromium/)
})

test('eight CI-native theme and language golden snapshots are committed', () => {
  const files = fs.readdirSync(snapshotDir).filter(name => name.endsWith('.png')).sort()
  assert.deepEqual(files, [
    'shell-en-dark-desktop-chromium-linux.png',
    'shell-en-dark-mobile-chromium-linux.png',
    'shell-en-light-desktop-chromium-linux.png',
    'shell-en-light-mobile-chromium-linux.png',
    'shell-vi-dark-desktop-chromium-linux.png',
    'shell-vi-dark-mobile-chromium-linux.png',
    'shell-vi-light-desktop-chromium-linux.png',
    'shell-vi-light-mobile-chromium-linux.png',
  ])
})

test('Pages deploy is followed by a deployed smoke gate', () => {
  assert.match(pages, /outputs:[\s\S]*page_url:/)
  assert.match(pages, /smoke:[\s\S]*needs: deploy/)
  assert.match(pages, /SMOKE_URL:/)
  assert.match(pages, /npm run smoke:deployed/)
  assert.match(smoke, /bootstrap\.mjs/)
  assert.match(smoke, /learningToggleBtn/)
})

test('one-time baseline generator is removed after golden snapshot creation', () => {
  assert.equal(fs.existsSync(new URL('../.github/workflows/visual-baseline.yml', import.meta.url)), false)
})
