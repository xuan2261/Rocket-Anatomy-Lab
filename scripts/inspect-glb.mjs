import { readFile } from 'node:fs/promises'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/inspect-glb.mjs <file.glb>')
  process.exit(2)
}

const bytes = await readFile(file)
if (bytes.length < 20 || bytes.subarray(0,4).toString('ascii') !== 'glTF') {
  throw new Error('Not a GLB file')
}
const version = bytes.readUInt32LE(4)
const declaredLength = bytes.readUInt32LE(8)
if (version !== 2) throw new Error(`Unsupported GLB version: ${version}`)
if (declaredLength !== bytes.length) throw new Error(`GLB length mismatch: header=${declaredLength} actual=${bytes.length}`)
let offset = 12
let doc = null
while (offset + 8 <= bytes.length) {
  const length = bytes.readUInt32LE(offset)
  const type = bytes.readUInt32LE(offset + 4)
  offset += 8
  if (type === 0x4e4f534a) {
    const text = bytes.subarray(offset, offset + length).toString('utf8').replace(/\0+$/,'').trim()
    doc = JSON.parse(text)
    break
  }
  offset += length
}
if (!doc) throw new Error('GLB JSON chunk not found')

const names = (doc.nodes ?? []).map(n => n.name ?? '')
const generic = names.filter(n => /^(group\d*|p(?:Cylinder|Cube|Cone)|polySurfa)/i.test(n)).length
const semanticRatio = names.length ? 1 - generic / names.length : 0
const semanticNaming = semanticRatio >= .65 ? 'good' : semanticRatio >= .35 ? 'unknown' : 'weak'
const verdict = semanticNaming === 'good' ? 'direct-use' : 'needs-semantic-manifest'

console.log(JSON.stringify({
  file,
  glb: { version, declaredLength, actualLength: bytes.length },
  counts: {
    scenes: doc.scenes?.length ?? 0,
    nodes: doc.nodes?.length ?? 0,
    meshes: doc.meshes?.length ?? 0,
    materials: doc.materials?.length ?? 0,
    animations: doc.animations?.length ?? 0,
  },
  sceneRoots: doc.scenes?.map(s => s.nodes ?? []) ?? [],
  nodeNames: names,
  semanticNaming,
  verdict,
}, null, 2))
