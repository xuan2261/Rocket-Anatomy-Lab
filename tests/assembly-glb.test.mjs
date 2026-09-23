import test from 'node:test'
import assert from 'node:assert/strict'
import {
  encodeGlb,
  parseGlb,
  qualifyAssemblyGlb,
  reauthorAssemblyGlb,
} from '../scripts/lib/assembly-glb.mjs'

const manifest = {
  id: 'synthetic-assembly-v1',
  label: 'Synthetic educational assembly',
  sourceLabel: 'Synthetic test fixture',
  educationalOnly: true,
  methodology: 'normalized-axis-triangle-partition',
  source: {
    repository: 'fixture/repo',
    path: 'fixture.glb',
    gitSha: 'not-enforced-in-test',
    primaryAxis: 'y',
    bounds: { min: [0, 0, 0], max: [1, 10, 1] },
  },
  segments: [
    { id: 'a', label: 'A', description: '', start: 0, end: 0.2, explodeSignedFactor: -2 },
    { id: 'b', label: 'B', description: '', start: 0.2, end: 0.4, explodeSignedFactor: -1 },
    { id: 'c', label: 'C', description: '', start: 0.4, end: 0.6, explodeSignedFactor: 0 },
    { id: 'd', label: 'D', description: '', start: 0.6, end: 0.8, explodeSignedFactor: 1 },
    { id: 'e', label: 'E', description: '', start: 0.8, end: 1, explodeSignedFactor: 2 },
  ],
}

const syntheticSource = () => {
  // Ten independent triangles, two in each normalized Y region. Geometry is intentionally
  // simple: this test validates scene-graph re-authoring, not visual fidelity.
  const positions = []
  const indices = []
  for (let triangle = 0; triangle < 10; triangle += 1) {
    const y = 0.5 + triangle
    const base = positions.length / 3
    positions.push(0, y, 0, 1, y, 0, 0, y, 1)
    indices.push(base, base + 1, base + 2)
  }
  const pos = Buffer.from(new Float32Array(positions).buffer)
  const idx = Buffer.from(new Uint16Array(indices).buffer)
  const idxOffset = (pos.length + 3) & ~3
  const bin = Buffer.concat([pos, Buffer.alloc(idxOffset - pos.length), idx])
  const json = {
    asset: { version: '2.0', generator: 'Rocket Anatomy Lab synthetic test' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'source', mesh: 0 }],
    meshes: [{ name: 'source-mesh', primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    materials: [{ name: 'test-material', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: pos.length, target: 34962 },
      { buffer: 0, byteOffset: idxOffset, byteLength: idx.length, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: positions.length / 3, type: 'VEC3', min: [0, 0.5, 0], max: [1, 9.5, 1] },
      { bufferView: 1, componentType: 5123, count: indices.length, type: 'SCALAR', min: [0], max: [positions.length / 3 - 1] },
    ],
  }
  return encodeGlb({ json, bin })
}

test('GLB encoder/parser round-trip a valid synthetic GLB', () => {
  const source = syntheticSource()
  const parsed = parseGlb(source)
  assert.equal(parsed.json.asset.version, '2.0')
  assert.equal(parsed.json.meshes.length, 1)
  assert.ok(parsed.bin.length > 0)
})

test('re-authorer partitions triangles into five independent assembly subtrees exactly once', () => {
  const source = syntheticSource()
  const { output, summary } = reauthorAssemblyGlb(source, manifest, { enforceGitSha: false })
  const result = qualifyAssemblyGlb(output, manifest)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.assemblyIds, ['a', 'b', 'c', 'd', 'e'])
  assert.deepEqual(summary.triangleCounts, { a: 2, b: 2, c: 2, d: 2, e: 2 })
  assert.equal(Object.values(summary.triangleCounts).reduce((sum, count) => sum + count, 0), 10)
  const { json } = parseGlb(output)
  assert.equal(json.nodes.length, 6)
  assert.equal(json.meshes.length, 5)
  assert.equal(json.animations, undefined)
  assert.equal(json.asset.extras.rocketAnatomyLabAssembly.historicalStageBoundaries, false)
})

test('re-authorer is fail-closed for source fingerprint drift', () => {
  assert.throws(
    () => reauthorAssemblyGlb(syntheticSource(), manifest),
    /Git blob SHA mismatch/,
  )
})
