import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('Phase 16 converts pinned NASA STL sources offline and serves only local GLB packages', async () => {
  const [builder, manifest, loader, docs] = await Promise.all([
    readFile(new URL('../scripts/build-stage-detail-packages.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../src/detailAssets.ts', import.meta.url), 'utf8'),
    readFile(new URL('../public/real-detail-loader.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../docs/PHASE16_STAGE_DETAIL_PACKAGES.md', import.meta.url), 'utf8'),
  ])

  assert.match(builder, /STLLoader/)
  assert.match(builder, /gitBlobSha/)
  assert.match(builder, /generated node count expected/)
  assert.match(builder, /sourcePart/)
  assert.match(builder, /0x46546c67/)
  assert.match(manifest, /generated-stl-package/)
  assert.match(manifest, /saturn-v-stage1/)
  assert.match(manifest, /saturn-v-stage2/)
  assert.match(loader, /loader\.loadAsync\(asset\.localUrl\)/)
  assert.doesNotMatch(loader, /raw\.githubusercontent\.com\/nasa\/NASA-3D-Resources/)
  assert.match(docs, /educational visualization/i)
  assert.match(docs, /does not reconstruct missing engineering geometry/i)
})
