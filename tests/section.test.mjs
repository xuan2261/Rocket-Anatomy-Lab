import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createSectionState,
  resetSection,
  sectionAriaValueText,
  sectionCoordinate,
  sectionPlaneDescriptor,
  setSectionAxis,
  setSectionCapped,
  setSectionEnabled,
  setSectionPosition,
  toggleSectionInverted,
} from '../public/core/section.js'

const bounds = {
  min: { x: -2, y: 10, z: 100 },
  max: { x: 2, y: 30, z: 140 },
}

test('section state starts disabled at the model midpoint with Y axis and capping enabled', () => {
  const state = createSectionState()
  assert.deepEqual(state, { enabled: false, axis: 'y', position: 0.5, inverted: false, capped: true })
  assert.equal(sectionCoordinate(state, bounds), 20)
})

test('section position clamps to the normalized model range and rejects non-finite values', () => {
  let state = createSectionState()
  state = setSectionPosition(state, 2)
  assert.equal(state.position, 1)
  state = setSectionPosition(state, -1)
  assert.equal(state.position, 0)
  assert.throws(() => setSectionPosition(state, Number.NaN), /must be finite/)
})

test('axis changes are explicit and unsupported axes fail closed', () => {
  let state = createSectionState()
  state = setSectionAxis(state, 'x')
  assert.equal(sectionCoordinate(state, bounds), 0)
  state = setSectionAxis(state, 'z')
  assert.equal(sectionCoordinate(state, bounds), 120)
  assert.throws(() => setSectionAxis(state, 'q'), /unsupported section axis/)
})

test('plane descriptor preserves the same geometric plane when direction is flipped', () => {
  let state = setSectionEnabled(createSectionState(), true)
  state = setSectionAxis(state, 'y')
  state = setSectionPosition(state, 0.25)
  const normal = sectionPlaneDescriptor(state, bounds)
  const flipped = sectionPlaneDescriptor(toggleSectionInverted(state), bounds)
  assert.deepEqual(normal.normal, [0, 1, 0])
  assert.equal(normal.coordinate, 15)
  assert.equal(normal.constant, -15)
  assert.deepEqual(flipped.normal, [0, -1, 0])
  assert.equal(flipped.coordinate, 15)
  assert.equal(flipped.constant, 15)
})

test('cap state is independent from clipping enablement', () => {
  let state = createSectionState()
  state = setSectionCapped(state, false)
  state = setSectionEnabled(state, true)
  assert.equal(state.enabled, true)
  assert.equal(state.capped, false)
})

test('reset restores the authored section defaults', () => {
  let state = createSectionState()
  state = setSectionEnabled(state, true)
  state = setSectionAxis(state, 'x')
  state = setSectionPosition(state, 0.91)
  state = toggleSectionInverted(state)
  state = setSectionCapped(state, false)
  assert.deepEqual(resetSection(), createSectionState())
})

test('ARIA value text exposes axis, percentage and direction without relying on color', () => {
  let state = createSectionState()
  state = setSectionPosition(state, 0.42)
  assert.match(sectionAriaValueText(state), /42% theo trục Y, hướng chuẩn/)
  state = toggleSectionInverted(state)
  assert.match(sectionAriaValueText(state), /hướng đảo/)
})

test('invalid bounds fail closed', () => {
  const state = createSectionState()
  assert.throws(() => sectionCoordinate(state, { min: { x: 0, y: 5, z: 0 }, max: { x: 1, y: 4, z: 1 } }), /invalid section bounds/)
})
