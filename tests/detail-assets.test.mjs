import test from 'node:test'
import assert from 'node:assert/strict'

import {
  detailAssetForNode,
  qualifiedDetailAssets,
  validateDetailAssetManifest,
} from '../public/core/detailAssets.js'

test('Phase 15 qualified detail manifest is pinned and internally valid', () => {
  assert.deepEqual(validateDetailAssetManifest(qualifiedDetailAssets), [])
  assert.equal(qualifiedDetailAssets.length, 1)

  const lm = detailAssetForNode('apollo-lm-sla')
  assert.ok(lm)
  assert.equal(lm.id, 'apollo-lunar-module')
  assert.equal(lm.byteLength, 716840)
  assert.equal(lm.gitBlobSha, '74b7b99a60f9903a0592fd763ed14482204e24d9')
  assert.equal(lm.localUrl, './assets/detail/apollo-lunar-module.glb')
  assert.match(lm.sourcePageUrl, /^https:\/\/science\.nasa\.gov\//)
  assert.match(lm.officialDownloadUrl, /^https:\/\/assets\.science\.nasa\.gov\//)
  assert.match(lm.githubRawUrl, /raw\.githubusercontent\.com\/nasa\/NASA-3D-Resources/)
})

test('Phase 15 exposes detail only for explicitly qualified anatomy nodes', () => {
  assert.equal(detailAssetForNode('sic-stage'), null)
  assert.equal(detailAssetForNode('sii-stage'), null)
  assert.equal(detailAssetForNode('apollo-command-module'), null)
  assert.ok(detailAssetForNode('apollo-lm-sla'))
})
