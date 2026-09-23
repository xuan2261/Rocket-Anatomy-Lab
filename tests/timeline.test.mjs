import test from 'node:test'
import assert from 'node:assert/strict'
import {
  advanceTimeline,
  cameraTransitionDurationMs,
  canAdvanceTimeline,
  canRetreatTimeline,
  createTimelineState,
  focusTimelineAssembly,
  orderedAssemblyIds,
  pauseTimeline,
  playTimeline,
  restartTimeline,
  retreatTimeline,
  seekTimeline,
  setTimelineDirection,
  setTimelineReducedMotion,
  standardTransitionDurationMs,
  timelineAssemblyAmounts,
  toggleTimelineDirection,
  validateTimelineAssemblyIds,
} from '../public/core/timeline.js'
import { nasaSaturnVAssemblyManifest } from '../public/core/assemblyManifest.js'

const ids = nasaSaturnVAssemblyManifest.segments.map(segment => segment.id)

test('timeline assembly ids are unique and fail closed on invalid input', () => {
  assert.deepEqual(validateTimelineAssemblyIds(ids), [])
  assert.throws(() => createTimelineState([]), /at least one assembly id/)
  assert.throws(() => createTimelineState(['a', 'a']), /duplicate timeline assembly id/)
})

test('next then previous restores the exact canonical step and transform amounts', () => {
  const initial = createTimelineState(ids)
  const next = advanceTimeline(initial)
  const back = retreatTimeline(next)
  assert.equal(next.stepIndex, 1)
  assert.equal(next.focusedAssemblyId, ids[0])
  assert.equal(back.stepIndex, 0)
  assert.equal(back.progress, 0)
  assert.deepEqual([...timelineAssemblyAmounts(back).values()], ids.map(() => 0))
})

test('restart always restores assembled baseline and forward direction', () => {
  let state = createTimelineState(ids)
  state = seekTimeline(state, ids.length)
  state = setTimelineDirection(state, 'reverse')
  state = playTimeline(state)
  state = restartTimeline(state)
  assert.equal(state.stepIndex, 0)
  assert.equal(state.progress, 0)
  assert.equal(state.direction, 'forward')
  assert.equal(state.playback, 'stopped')
  assert.equal(state.focusedAssemblyId, null)
  assert.deepEqual([...timelineAssemblyAmounts(state).values()], ids.map(() => 0))
})

test('reverse direction traverses the exact inverse assembly order', () => {
  let state = createTimelineState(ids)
  assert.deepEqual(orderedAssemblyIds(state), ids)
  state = seekTimeline(state, ids.length)
  state = toggleTimelineDirection(state)
  assert.deepEqual(orderedAssemblyIds(state), [...ids].reverse())
  const crossed = []
  while (canAdvanceTimeline(state)) {
    state = advanceTimeline(state)
    crossed.push(state.focusedAssemblyId)
  }
  assert.deepEqual(crossed, [...ids].reverse())
  assert.equal(state.stepIndex, 0)
})

test('play/pause state is deterministic and stops at an endpoint', () => {
  let state = createTimelineState(ids)
  state = playTimeline(state)
  assert.equal(state.playback, 'playing')
  state = pauseTimeline(state)
  assert.equal(state.playback, 'paused')
  state = seekTimeline(state, ids.length)
  state = playTimeline(state)
  assert.equal(state.playback, 'stopped')
  assert.equal(canAdvanceTimeline(state), false)
  assert.equal(canRetreatTimeline(state), true)
})

test('reduced motion preserves logical states while removing spatial tween durations', () => {
  let state = createTimelineState(ids)
  state = setTimelineReducedMotion(state, true)
  assert.equal(standardTransitionDurationMs(state), 0)
  assert.equal(cameraTransitionDurationMs(state), 0)
  state = advanceTimeline(state)
  assert.equal(state.stepIndex, 1)
  assert.equal(timelineAssemblyAmounts(state).get(ids[0]), 1)
  assert.equal(timelineAssemblyAmounts(state).get(ids[1]), 0)
  state = setTimelineReducedMotion(state, false)
  assert.equal(standardTransitionDurationMs(state), 320)
  assert.equal(cameraTransitionDurationMs(state), 480)
})

test('unknown assembly ids fail closed and seeking rejects invalid steps', () => {
  const state = createTimelineState(ids)
  assert.throws(() => focusTimelineAssembly(state, 'not-an-assembly'), /unknown timeline assembly id/)
  assert.throws(() => seekTimeline(state, -1), /step out of range/)
  assert.throws(() => seekTimeline(state, ids.length + 1), /step out of range/)
  assert.throws(() => seekTimeline(state, 1.5), /step out of range/)
})

test('canonical progress yields cumulative digital separation from authored baseline', () => {
  let state = createTimelineState(ids)
  for (let step = 0; step <= ids.length; step += 1) {
    state = seekTimeline(state, step)
    const amounts = timelineAssemblyAmounts(state)
    assert.equal(state.progress, step / ids.length)
    ids.forEach((id, index) => assert.equal(amounts.get(id), index < step ? 1 : 0))
  }
})
