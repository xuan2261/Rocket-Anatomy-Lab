import test from 'node:test'
import assert from 'node:assert/strict'
import {
  initialState, selectPart, setExplode, setMode, toggleHidden, toggleIsolate,
  showAll, deriveView, validateManifest
} from '../public/core/engine.js'
import { demoManifest } from '../public/core/demoManifest.js'
import { nasaSaturnVQualification } from '../public/core/assetQualification.js'

test('demo manifest is structurally valid', () => {
  assert.deepEqual(validateManifest(demoManifest), [])
})

test('explode amount is clamped to a safe normalized UI range', () => {
  assert.equal(setExplode(initialState(), 2).explode, 1)
  assert.equal(setExplode(initialState(), -1).explode, 0)
})

test('hide state toggles without mutating the previous Set', () => {
  const a = initialState()
  const b = toggleHidden(a, 'upper-stage')
  assert.equal(a.hiddenIds.has('upper-stage'), false)
  assert.equal(b.hiddenIds.has('upper-stage'), true)
})

test('isolate makes only the selected semantic group visible', () => {
  let state = selectPart(initialState(), 'middle-stage')
  state = toggleIsolate(state, 'middle-stage')
  const view = deriveView(demoManifest, state)
  assert.equal(view.find(v => v.id === 'middle-stage').visible, true)
  assert.equal(view.filter(v => v.id !== 'middle-stage').every(v => !v.visible), true)
})

test('xray keeps selected group opaque and ghosts the rest', () => {
  let state = selectPart(initialState(), 'upper-stage')
  state = setMode(state, 'xray')
  const view = deriveView(demoManifest, state)
  assert.equal(view.find(v => v.id === 'upper-stage').opacity, 1)
  assert.equal(view.filter(v => v.id !== 'upper-stage').every(v => v.opacity === 0.16), true)
})

test('showAll clears hide and isolate state', () => {
  let state = toggleHidden(initialState(), 'lower-stage')
  state = toggleIsolate(state, 'upper-stage')
  state = showAll(state)
  assert.equal(state.hiddenIds.size, 0)
  assert.equal(state.isolatedId, null)
})

test('NASA Saturn V metadata gate requires a semantic manifest rather than guessed labels', () => {
  assert.equal(nasaSaturnVQualification.nodeCount, 23)
  assert.equal(nasaSaturnVQualification.meshCount, 22)
  assert.equal(nasaSaturnVQualification.semanticNaming, 'weak')
  assert.equal(nasaSaturnVQualification.verdict, 'needs-semantic-manifest')
})
