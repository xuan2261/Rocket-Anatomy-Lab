import test from 'node:test'
import assert from 'node:assert/strict'
import { encodeGlb, githubBlobSha } from '../scripts/lib/assembly-glb.mjs'
import { qualifySourceGlb } from '../scripts/lib/source-intake.mjs'

const synthetic = () => encodeGlb({
  json: {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'fixture', mesh: 0 }],
    meshes: [{ primitives: [] }],
    buffers: [],
  },
  bin: Buffer.alloc(0),
})

test('source intake accepts an exact pinned GLB and reports structural metadata', () => {
  const buffer = synthetic()
  const manifest = { source: { gitSha: githubBlobSha(buffer) } }
  const result = qualifySourceGlb(buffer, manifest)
  assert.deepEqual(result.errors, [])
  assert.equal(result.gltfVersion, '2.0')
  assert.equal(result.nodeCount, 1)
  assert.equal(result.meshCount, 1)
})

test('source intake rejects fingerprint drift even for another valid GLB', () => {
  const buffer = synthetic()
  const manifest = { source: { gitSha: '0000000000000000000000000000000000000000' } }
  const result = qualifySourceGlb(buffer, manifest)
  assert.match(result.errors.join('\n'), /Git blob SHA mismatch/)
})

test('source intake rejects malformed bytes before copying them into assets', () => {
  const buffer = Buffer.from('not-a-glb')
  const manifest = { source: { gitSha: githubBlobSha(buffer) } }
  const result = qualifySourceGlb(buffer, manifest)
  assert.match(result.errors.join('\n'), /invalid GLB/)
})

test('source intake rejects SHA-256 drift even when Git blob fingerprint is configured independently', () => {
  const buffer = synthetic()
  const manifest = {
    source: {
      gitSha: githubBlobSha(buffer),
      sha256: '0'.repeat(64),
      byteLength: buffer.length,
    },
  }
  const result = qualifySourceGlb(buffer, manifest)
  assert.match(result.errors.join('\n'), /SHA-256 mismatch/)
})

test('source intake rejects byte-length drift', () => {
  const buffer = synthetic()
  const manifest = {
    source: {
      gitSha: githubBlobSha(buffer),
      byteLength: buffer.length + 1,
    },
  }
  const result = qualifySourceGlb(buffer, manifest)
  assert.match(result.errors.join('\n'), /byte length mismatch/)
})
