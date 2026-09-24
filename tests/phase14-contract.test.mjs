import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('Phase 14 schematic detail layer remains visual-only and uses official Three.js primitives', async () => {
  const [module, realApp, html, docs] = await Promise.all([
    readFile(new URL('../public/procedural-detail-layer.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../public/real-app.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../docs/PHASE14_PROCEDURAL_DETAIL.md', import.meta.url), 'utf8'),
  ])

  assert.match(module, /new THREE\.InstancedMesh/)
  assert.match(module, /new THREE\.EdgesGeometry/)
  assert.match(module, /isSchematic/)
  assert.match(module, /setSectionEnabled/)
  assert.doesNotMatch(module, /three-mesh-bvh|three-bvh-csg|cannon|ammo|rapier/i)
  assert.match(realApp, /createProceduralDetailLayer/)
  assert.match(realApp, /proceduralDetailLayer\?\.setSectionEnabled/)
  assert.match(html, /id="schematicDetailBtn"/)
  assert.match(html, /id="schematicExplodeSlider"/)
  assert.match(docs, /not manufacturing|not manufacturing or engineering-accurate/i)
})
