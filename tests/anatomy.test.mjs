import test from 'node:test'
import assert from 'node:assert/strict'
import {
  anatomyChildren, anatomyNodeById, anatomyPath, anatomyText,
  saturnVAnatomyManifest, validateAnatomyManifest,
} from '../public/core/anatomy.js'

test('Phase 12 anatomy manifest is connected and NASA-sourced', () => {
  assert.deepEqual(validateAnatomyManifest(saturnVAnatomyManifest), [])
  assert.deepEqual(
    anatomyChildren(saturnVAnatomyManifest, saturnVAnatomyManifest.rootId).map(node => node.id),
    ['sic-stage','sii-stage','sivb-stage','instrument-unit','apollo-spacecraft'],
  )
  for (const node of saturnVAnatomyManifest.nodes) {
    assert.ok(node.normalizedPosition >= 0 && node.normalizedPosition <= 1)
    assert.match(node.sourceUrl, /^https:\/\/(?:www\.)?(?:nasa\.gov|science\.nasa\.gov|ntrs\.nasa\.gov)\//)
  }
})

test('Phase 12 drill-down exposes detailed references without claiming source geometry', () => {
  assert.deepEqual(
    anatomyPath(saturnVAnatomyManifest, 'sic-lox-tank').map(node => node.id),
    ['saturn-v','sic-stage','sic-lox-tank'],
  )
  const item=anatomyNodeById(saturnVAnatomyManifest,'sic-lox-tank')
  assert.ok(item)
  assert.equal(item.binding,'approximate-region')
  assert.equal(item.focusAssemblyId,'lower-body-assembly')
  assert.equal(anatomyText(item.label,'vi'),'Bồn LOX')
  assert.equal(anatomyText(item.label,'en'),'LOX tank')
  assert.ok(anatomyChildren(saturnVAnatomyManifest,'sic-stage').length >= 5)
  assert.ok(anatomyChildren(saturnVAnatomyManifest,'sii-stage').length >= 5)
  assert.ok(anatomyChildren(saturnVAnatomyManifest,'apollo-spacecraft').length >= 4)
})
