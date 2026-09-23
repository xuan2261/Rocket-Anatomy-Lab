import test from 'node:test'
import assert from 'node:assert/strict'
import {
  axisComponentIndex,
  normalizeAxisPosition,
  segmentForNormalizedPosition,
  validateAssemblyManifest,
} from '../public/core/assembly.js'
import {
  nasaSaturnVAssemblyManifest,
  nasaSaturnVAssemblySemanticManifest,
} from '../public/core/assemblyManifest.js'


test('assembly manifest is contiguous, normalized, educational-only and axis-pinned', () => {
  assert.deepEqual(validateAssemblyManifest(nasaSaturnVAssemblyManifest), [])
  assert.equal(nasaSaturnVAssemblyManifest.educationalOnly, true)
  assert.equal(nasaSaturnVAssemblyManifest.source.primaryAxis, 'y')
  assert.equal(nasaSaturnVAssemblyManifest.segments.length, 5)
})

test('assembly segments cover every normalized position exactly by contiguous ranges', () => {
  const expected = [
    [0, 'base-assembly'],
    [0.159999, 'base-assembly'],
    [0.16, 'lower-body-assembly'],
    [0.349999, 'lower-body-assembly'],
    [0.35, 'center-body-assembly'],
    [0.61, 'upper-body-assembly'],
    [0.88, 'nose-stack-assembly'],
    [1, 'nose-stack-assembly'],
  ]
  for (const [position, id] of expected) {
    assert.equal(segmentForNormalizedPosition(nasaSaturnVAssemblyManifest, position).id, id)
  }
})

test('axis normalization clamps and axis indexing is deterministic', () => {
  assert.equal(normalizeAxisPosition(-1, 0, 10), 0)
  assert.equal(normalizeAxisPosition(5, 0, 10), 0.5)
  assert.equal(normalizeAxisPosition(11, 0, 10), 1)
  assert.equal(axisComponentIndex('x'), 0)
  assert.equal(axisComponentIndex('y'), 1)
  assert.equal(axisComponentIndex('z'), 2)
})

test('assembly semantic manifest carries no historical stage labels', () => {
  const text = JSON.stringify(nasaSaturnVAssemblySemanticManifest)
  assert.doesNotMatch(text, /\bS-IC\b|\bS-II\b|\bS-IVB\b/)
  assert.equal(nasaSaturnVAssemblySemanticManifest.mappingKind, 'assembly-node-map')
})
