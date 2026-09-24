import test from 'node:test'
import assert from 'node:assert/strict'

import {
  detailAssetForNode,
  generatedStageDetailAssets,
  validateGeneratedStageDetailManifest,
} from '../public/core/detailAssets.js'

test('Phase 16 stage detail manifest pins the official NASA multi-part sources', () => {
  assert.deepEqual(validateGeneratedStageDetailManifest(generatedStageDetailAssets), [])
  assert.equal(generatedStageDetailAssets.length, 2)

  const stage1 = detailAssetForNode('sic-stage')
  assert.ok(stage1)
  assert.equal(stage1.sourceKind, 'generated-stl-package')
  assert.equal(stage1.partCount, 4)
  assert.equal(stage1.sourceParts.length, 4)
  assert.deepEqual(stage1.sourceParts.map(part => part.byteLength), [491684, 330184, 299784, 1790934])

  const stage2 = detailAssetForNode('sii-stage')
  assert.ok(stage2)
  assert.equal(stage2.sourceKind, 'generated-stl-package')
  assert.equal(stage2.partCount, 3)
  assert.equal(stage2.sourceParts.length, 3)
  assert.deepEqual(stage2.sourceParts.map(part => part.byteLength), [512684, 684, 1380284])

  for (const asset of generatedStageDetailAssets) {
    assert.match(asset.sourcePageUrl, /^https:\/\/science\.nasa\.gov\//)
    for (const part of asset.sourceParts) {
      assert.match(part.githubRawUrl, /raw\.githubusercontent\.com\/nasa\/NASA-3D-Resources/)
      assert.match(part.gitBlobSha, /^[0-9a-f]{40}$/)
    }
  }
})
