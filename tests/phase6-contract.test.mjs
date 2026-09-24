import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8')
const real = fs.readFileSync(new URL('../public/real-app.mjs', import.meta.url), 'utf8')
const fallback = fs.readFileSync(new URL('../public/fallback-app.mjs', import.meta.url), 'utf8')
const controller = fs.readFileSync(new URL('../public/learning-controller.mjs', import.meta.url), 'utf8')
const section = fs.readFileSync(new URL('../public/section-controller.mjs', import.meta.url), 'utf8')
const i18n = fs.readFileSync(new URL('../public/i18n.mjs', import.meta.url), 'utf8')

test('Phase 6 exposes disclosure-based guided learning and semantic annotation layer', () => {
  assert.match(html, /id="learningToggleBtn"[^>]*aria-expanded="true"[^>]*aria-controls="learningPanelBody"/)
  assert.match(html, /id="learningPanelBody"/)
  assert.match(html, /id="annotationLayer"/)
  assert.match(html, /id="learningApplyViewBtn"/)
  assert.match(html, /id="learningCopyLinkBtn"/)
})

test('learning controls and annotation markers preserve effective 44px touch targets', () => {
  assert.match(css, /\.annotation-marker\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/s)
  assert.match(css, /\.learning-controls button\s*\{[^}]*min-height:\s*44px;/s)
})

test('real renderer projects semantic assembly anchors and updates annotations every frame', () => {
  assert.match(real, /createLearningController/)
  assert.match(real, /annotationAnchorForGroup/)
  assert.match(real, /learningController\?\.updateAnnotations\?\.\(\)/)
  assert.match(real, /sectionController\?\.applyPreset\?\.\(lesson\.sectionPreset\)/)
  assert.match(real, /focusCameraOnGroup\(assemblyId/)
})

test('fallback disables guided learning rather than simulating semantic lessons', () => {
  assert.match(fallback, /createLearningController/)
  assert.match(fallback, /disabled:\s*true/)
})

test('section controller applies lesson presets through the existing section state API', () => {
  assert.match(section, /const applyPreset = preset =>/)
  assert.match(section, /setSectionAxis/)
  assert.match(section, /setSectionPosition/)
  assert.match(section, /applyPreset,/)
})

test('learning content is bilingual and shared URLs carry language state', () => {
  assert.match(i18n, /'learning\.lesson\.base\.title'/)
  assert.match(i18n, /'learning\.lesson\.nose\.body'/)
  assert.match(i18n, /queryLanguage/)
  assert.match(i18n, /url\.searchParams\.set\('lang', next\)/)
})

test('Phase 6 remains free of raw NASA presentation-node coupling', () => {
  for (const code of [controller, real]) {
    assert.doesNotMatch(code, /pCylinder|polySurfa|group\d+/)
  }
})
