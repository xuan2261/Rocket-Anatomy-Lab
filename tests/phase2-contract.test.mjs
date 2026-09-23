import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { nasaSaturnVCuratedManifest } from '../public/core/curatedManifest.js'
import {
  nasaSaturnVVerifiedInventory,
  primaryBodyLongitudinalCoverage,
  verifiedRenderableNodeNames,
} from '../public/core/nasaSaturnVInventory.js'
import { curatedNodeMap, validateCuratedCoverage, validateSemanticManifest } from '../public/core/semantic.js'

test('curated NASA semantic manifest validates and covers every verified renderable node exactly once', () => {
  assert.deepEqual(validateSemanticManifest(nasaSaturnVCuratedManifest), [])
  assert.deepEqual(validateCuratedCoverage(nasaSaturnVCuratedManifest, verifiedRenderableNodeNames), [])
  assert.equal(curatedNodeMap(nasaSaturnVCuratedManifest).size, nasaSaturnVVerifiedInventory.renderableNodeCount)
})

test('curated map is pinned to the verified official NASA GLB blob', () => {
  assert.equal(nasaSaturnVCuratedManifest.assetFingerprint.gitSha, '1299e866c174346d0967cd3fd3250f81515fd522')
  assert.equal(nasaSaturnVCuratedManifest.assetFingerprint.expectedMeshCount, 22)
  assert.equal(nasaSaturnVCuratedManifest.assetFingerprint.expectedNodeCount, 23)
})

test('primary body shell proves the current GLB is not a clean stage-separable assembly', () => {
  const shell = nasaSaturnVCuratedManifest.groups.find(group => group.id === 'primary-body-shell')
  assert.deepEqual(shell.nodeNames, ['pCylinder1'])
  assert.equal(shell.explodeSignedFactor, 0)
  assert.ok(primaryBodyLongitudinalCoverage() > 0.95)
  const body = nasaSaturnVVerifiedInventory.nodes.find(node => node.name === 'pCylinder1')
  assert.equal(body.primitiveCount, 9)
})

test('real renderer uses curated mapping fail-closed and keeps raw inventory safe', () => {
  const code = fs.readFileSync(new URL('../public/real-app.mjs', import.meta.url), 'utf8')
  assert.match(code, /nasaSaturnVCuratedManifest/)
  assert.match(code, /validateCuratedCoverage/)
  assert.match(code, /primaryAxis/)
  assert.match(code, /throw new Error\(`Curated NASA node map does not match imported asset/)
  assert.match(code, /rawName\.textContent = partRoot\.name/)
  assert.doesNotMatch(code, /innerHTML\s*=/)
  assert.doesNotMatch(code, /classifyBands/)
  assert.match(code, /resizeObserver\.disconnect\(\)/)
  assert.match(code, /value\?\.isTexture/)
})

test('curated labels do not pretend the raw full-body mesh is a historical stage split', () => {
  const allText = nasaSaturnVCuratedManifest.groups.map(group => `${group.label} ${group.description}`).join(' ')
  assert.doesNotMatch(allText, /\bS-IC\b|\bS-II\b|\bS-IVB\b/)
})
