import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { nasaSaturnVAssemblyManifest } from '../public/core/assemblyManifest.js'
import { validateAssemblyManifest } from '../public/core/assembly.js'


test('phase 3 assembly pipeline is pinned, reversible by transform, and educational-only', () => {
  assert.deepEqual(validateAssemblyManifest(nasaSaturnVAssemblyManifest), [])
  assert.equal(nasaSaturnVAssemblyManifest.source.gitSha, '1299e866c174346d0967cd3fd3250f81515fd522')
  assert.equal(nasaSaturnVAssemblyManifest.methodology, 'normalized-axis-triangle-partition')
  assert.equal(nasaSaturnVAssemblyManifest.educationalOnly, true)
  assert.ok(nasaSaturnVAssemblyManifest.segments.some(segment => segment.explodeSignedFactor < 0))
  assert.ok(nasaSaturnVAssemblyManifest.segments.some(segment => segment.explodeSignedFactor > 0))
})

test('real renderer prefers assembly-capable GLB and falls back to presentation asset', () => {
  const code = fs.readFileSync(new URL('../public/real-app.mjs', import.meta.url), 'utf8')
  assert.match(code, /saturn-v-education\.glb/)
  assert.match(code, /applyAssemblyMapping/)
  assert.match(code, /historicalStageBoundaries/)
  assert.match(code, /app\.assetAssembly/)
  assert.match(code, /app\.assetPresentation/)
  assert.match(code, /using verified presentation asset/)
  const i18n = fs.readFileSync(new URL('../public/i18n.mjs', import.meta.url), 'utf8')
  assert.match(i18n, /GLB giáo dục hỗ trợ lắp\/tách/)
  assert.match(i18n, /Assembly-capable educational GLB/)
  assert.doesNotMatch(code, /innerHTML\s*=/)
})

test('GLB re-authorer does not embed historical stage labels or operational data', () => {
  const code = fs.readFileSync(new URL('../scripts/lib/assembly-glb.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(code, /\bS-IC\b|\bS-II\b|\bS-IVB\b/)
  assert.match(code, /historicalStageBoundaries: false/)
  assert.match(code, /normalized-axis-triangle-partition|manifest\.methodology/)
})
