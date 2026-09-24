import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generatedStageDetailAssets } from '../public/core/detailAssets.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const inspectGlb = buffer => {
  assert.ok(buffer.length > 20)
  assert.equal(buffer.readUInt32LE(0), 0x46546c67)
  assert.equal(buffer.readUInt32LE(4), 2)
  assert.equal(buffer.readUInt32LE(8), buffer.length)
  const jsonLength = buffer.readUInt32LE(12)
  assert.equal(buffer.readUInt32LE(16), 0x4e4f534a)
  return JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength).trimEnd())
}

for (const asset of generatedStageDetailAssets) {
  test(`Phase 16 generated package ${asset.id} keeps every NASA STL as an independent node`, () => {
    const filePath = path.join(root, 'public', asset.localUrl.replace(/^\.\//, ''))
    assert.equal(fs.existsSync(filePath), true, `${filePath} should be created by build:stage-detail-assets`)
    const json = inspectGlb(fs.readFileSync(filePath))
    assert.equal(json.nodes.length, asset.partCount)
    assert.equal(json.meshes.length, asset.partCount)
    assert.equal(json.asset.extras.approximatePlacement, true)

    const partIds = new Set(json.nodes.map(node => node.extras?.sourcePart))
    for (const part of asset.sourceParts) assert.equal(partIds.has(part.id), true)
    for (const mesh of json.meshes) {
      const positionAccessor = json.accessors[mesh.primitives[0].attributes.POSITION]
      assert.ok(positionAccessor.count >= 3)
    }
  })
}
