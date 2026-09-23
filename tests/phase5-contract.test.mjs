import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8')
const real = fs.readFileSync(new URL('../public/real-app.mjs', import.meta.url), 'utf8')
const fallback = fs.readFileSync(new URL('../public/fallback-app.mjs', import.meta.url), 'utf8')
const controller = fs.readFileSync(new URL('../public/section-controller.mjs', import.meta.url), 'utf8')
const section = fs.readFileSync(new URL('../src/section.ts', import.meta.url), 'utf8')

const rawNasaNames = /pCylinder[1-5]|polySurfa[1-4]|group(?:1|3|6|7|8|9|10|11)/

test('Phase 5 exposes accessible section, axis, position, direction and cap controls', () => {
  for (const id of ['sectionToggleBtn','sectionSlider','sectionInvertBtn','sectionCapBtn','sectionStatus']) {
    assert.match(html, new RegExp(`id="${id}"`))
  }
  for (const axis of ['x','y','z']) assert.match(html, new RegExp(`data-section-axis="${axis}"`))
  assert.match(html, /sectionSlider[^>]+type="range"/)
  assert.match(html, /sectionSlider[^>]+aria-describedby="sectionStatus"/)
  assert.match(html, /sectionStatus[^>]+aria-live="polite"/)
})

test('Section controls preserve effective 44px targets and keyboard-visible focus', () => {
  assert.match(css, /button\s*\{[^}]*min-height:\s*44px;/s)
  assert.match(css, /section-slider-row input\s*\{[^}]*min-height:\s*44px;/s)
  assert.match(css, /section-axis-group\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(44px,/s)
  assert.match(css, /focus-visible[^}]*outline:/s)
})

test('Three.js renderer enables local clipping and explicit stencil buffer', () => {
  assert.match(real, /new THREE\.WebGLRenderer\(\{[^}]*stencil:\s*true/s)
  assert.match(real, /renderer\.localClippingEnabled\s*=\s*true/)
  assert.match(real, /material\.clippingPlanes\s*=\s*\[sectionPlane\]/)
})

test('cap implementation follows front/back stencil parity and clears stencil after cap', () => {
  assert.match(real, /THREE\.BackSide/)
  assert.match(real, /THREE\.FrontSide/)
  assert.match(real, /THREE\.IncrementWrapStencilOp/)
  assert.match(real, /THREE\.DecrementWrapStencilOp/)
  assert.match(real, /THREE\.NotEqualStencilFunc/)
  assert.match(real, /clearStencil\(\)/)
})

test('stencil helpers cannot receive semantic material state or ray selection', () => {
  assert.match(real, /!object\.userData\?\.rocketSectionStencil/)
  assert.match(real, /stencil\.raycast\s*=\s*\(\)\s*=>\s*\{\}/)
})

test('fallback disables Section rather than pretending procedural geometry is capped GLB', () => {
  assert.match(fallback, /createSectionController/)
  assert.match(fallback, /cappingSupported:\s*false/)
  assert.match(fallback, /disabled:\s*true/)
})

test('Section state and renderer remain free of raw NASA presentation-node coupling', () => {
  assert.doesNotMatch(section, rawNasaNames)
  assert.doesNotMatch(controller, rawNasaNames)
})
