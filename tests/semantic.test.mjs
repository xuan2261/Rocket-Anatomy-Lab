import test from 'node:test'
import assert from 'node:assert/strict'
import { initialState, selectPart, setExplode, setMode, toggleHidden, toggleIsolate } from '../public/core/engine.js'
import { nasaSaturnVGeometricManifest, deriveSemanticView, validateSemanticManifest } from '../public/core/semantic.js'

test('NASA geometric manifest validates', () => {
  assert.deepEqual(validateSemanticManifest(nasaSaturnVGeometricManifest), [])
  assert.equal(nasaSaturnVGeometricManifest.groups.length, 5)
})

test('semantic selection remains opaque in xray while unselected groups ghost', () => {
  let state = selectPart(initialState(), 'band-2')
  state = setMode(state, 'xray')
  const view = deriveSemanticView(nasaSaturnVGeometricManifest, state)
  const selected = view.find(item => item.id === 'band-2')
  const other = view.find(item => item.id === 'band-1')
  assert.equal(selected.opacity, 1)
  assert.equal(selected.wireframe, false)
  assert.equal(other.opacity, 0.14)
  assert.equal(other.wireframe, true)
})

test('semantic hide and isolate are deterministic and do not mutate earlier state', () => {
  const initial = initialState()
  const hidden = toggleHidden(initial, 'band-0')
  const isolated = toggleIsolate(hidden, 'band-3')
  assert.equal(initial.hiddenIds.size, 0)
  assert.equal(hidden.hiddenIds.has('band-0'), true)
  const view = deriveSemanticView(nasaSaturnVGeometricManifest, isolated)
  assert.equal(view.find(item => item.id === 'band-3').visible, true)
  assert.equal(view.filter(item => item.visible).length, 1)
})

test('semantic explode uses signed factors and engine clamps slider', () => {
  const state = setExplode(initialState(), 3)
  const view = deriveSemanticView(nasaSaturnVGeometricManifest, state)
  assert.equal(state.explode, 1)
  assert.deepEqual(view.map(item => item.explodeSignedFactor), [-1, -0.5, 0, 0.5, 1])
})
