import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8')
const real = fs.readFileSync(new URL('../public/real-app.mjs', import.meta.url), 'utf8')
const fallback = fs.readFileSync(new URL('../public/fallback-app.mjs', import.meta.url), 'utf8')
const controller = fs.readFileSync(new URL('../public/timeline-controller.mjs', import.meta.url), 'utf8')
const timeline = fs.readFileSync(new URL('../src/timeline.ts', import.meta.url), 'utf8')

const rawNasaNames = /pCylinder[1-5]|polySurfa[1-4]|group(?:1|3|6|7|8|9|10|11)/

test('Phase 4 exposes semantic Previous Play Next Restart Direction and native range controls', () => {
  for (const id of ['timelinePreviousBtn','timelinePlayBtn','timelineNextBtn','timelineRestartBtn','timelineDirectionBtn','timelineSlider','timelineStatus']) {
    assert.match(html, new RegExp(`id="${id}"`))
  }
  assert.match(html, /timelinePlayBtn[^>]+aria-pressed="false"/)
  assert.match(html, /timelineDirectionBtn[^>]+aria-pressed="false"/)
  assert.match(html, /timelineSlider[^>]+type="range"/)
  assert.match(html, /timelineStatus[^>]+aria-live="polite"/)
})

test('Phase 4 controls retain 44px effective targets and visible keyboard focus', () => {
  assert.match(css, /button\s*\{[^}]*min-height:\s*44px;/s)
  assert.match(css, /timeline-slider-row input\s*\{[^}]*min-height:\s*44px;/s)
  assert.match(css, /focus-visible[^}]*outline:/s)
})

test('Phase 4 honors prefers-reduced-motion in both CSS and runtime state', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(controller, /matchMedia\?\.\('\(prefers-reduced-motion: reduce\)'\)/)
  assert.match(controller, /setTimelineReducedMotion/)
  assert.match(real, /standardTransitionDurationMs/)
  assert.match(real, /cameraTransitionDurationMs/)
})

test('renderer consumes framework-independent timeline state and does not own step ordering', () => {
  assert.match(real, /timelineAssemblyAmounts/)
  assert.match(real, /createTimelineController/)
  assert.doesNotMatch(real, /assemblyIds\s*=\s*\[/)
  assert.match(timeline, /advanceTimeline/)
  assert.match(timeline, /retreatTimeline/)
})

test('manual orbit cancels camera interpolation and restart uses authored overview state', () => {
  assert.match(real, /controls\.addEventListener\('start',\s*\(\)\s*=>\s*\{\s*cameraTransition\s*=\s*null\s*\}\)/s)
  assert.match(real, /restoreOverviewCamera/)
  assert.match(real, /rocketBasePosition/)
})

test('fallback disables the guided timeline rather than simulating assembly claims', () => {
  assert.match(fallback, /createTimelineController/)
  assert.match(fallback, /disabled:\s*true/)
})

test('Phase 4 remains free of raw NASA presentation-node coupling', () => {
  assert.doesNotMatch(timeline, rawNasaNames)
  assert.doesNotMatch(controller, rawNasaNames)
})
