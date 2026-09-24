import path from 'node:path'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestUrl = pathToFileURL(path.join(root, 'public/core/detailAssets.js')).href
const { generatedStageDetailAssets, validateGeneratedStageDetailManifest } = await import(manifestUrl)

const manifestErrors = validateGeneratedStageDetailManifest(generatedStageDetailAssets)
if (manifestErrors.length) {
  console.error(JSON.stringify({ status: 'INVALID_STAGE_DETAIL_MANIFEST', errors: manifestErrors }, null, 2))
  process.exit(2)
}

const gitBlobSha = buffer => {
  const prefix = Buffer.from(`blob ${buffer.length}\0`)
  return createHash('sha1').update(prefix).update(buffer).digest('hex')
}

const align4 = value => (value + 3) & ~3
const toArrayBuffer = buffer => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

const fetchPinnedPart = async (asset, part) => {
  const response = await fetch(part.githubRawUrl, { redirect: 'follow' })
  if (!response.ok) throw new Error(`${asset.id}/${part.id}: HTTP ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  const errors = []
  if (buffer.length !== part.byteLength) errors.push(`byteLength expected ${part.byteLength}, got ${buffer.length}`)
  const actualBlobSha = gitBlobSha(buffer)
  if (actualBlobSha !== part.gitBlobSha) errors.push(`git blob SHA expected ${part.gitBlobSha}, got ${actualBlobSha}`)
  if (errors.length) throw new Error(`${asset.id}/${part.id}: ${errors.join('; ')}`)
  return { buffer, actualBlobSha }
}

const accessorBounds = array => {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let index = 0; index < array.length; index += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = array[index + axis]
      if (value < min[axis]) min[axis] = value
      if (value > max[axis]) max[axis] = value
    }
  }
  return { min, max }
}

const packStageGlb = (asset, parsedParts) => {
  const binaryChunks = []
  const bufferViews = []
  const accessors = []
  const meshes = []
  const nodes = []
  const materials = [
    { name: 'NASA source surface', pbrMetallicRoughness: { baseColorFactor: [0.78, 0.81, 0.85, 1], metallicFactor: 0, roughnessFactor: 0.78 }, doubleSided: true },
  ]
  let byteOffset = 0

  const addFloatAttribute = (array, { target = 34962, includeBounds = false } = {}) => {
    const source = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
    const alignedOffset = align4(byteOffset)
    if (alignedOffset > byteOffset) binaryChunks.push(Buffer.alloc(alignedOffset - byteOffset))
    byteOffset = alignedOffset

    const viewIndex = bufferViews.length
    bufferViews.push({ buffer: 0, byteOffset, byteLength: source.length, target })
    binaryChunks.push(source)
    byteOffset += source.length

    const accessor = {
      bufferView: viewIndex,
      byteOffset: 0,
      componentType: 5126,
      count: array.length / 3,
      type: 'VEC3',
    }
    if (includeBounds) Object.assign(accessor, accessorBounds(array))
    const accessorIndex = accessors.length
    accessors.push(accessor)
    return accessorIndex
  }

  for (const { part, geometry } of parsedParts) {
    const positionAttribute = geometry.getAttribute('position')
    if (!positionAttribute || positionAttribute.count < 3) throw new Error(`${asset.id}/${part.id}: STL has no triangle positions`)

    let normalAttribute = geometry.getAttribute('normal')
    if (!normalAttribute || normalAttribute.count !== positionAttribute.count) {
      geometry.computeVertexNormals()
      normalAttribute = geometry.getAttribute('normal')
    }

    const positions = positionAttribute.array instanceof Float32Array
      ? positionAttribute.array
      : new Float32Array(positionAttribute.array)
    const normals = normalAttribute.array instanceof Float32Array
      ? normalAttribute.array
      : new Float32Array(normalAttribute.array)

    const positionAccessor = addFloatAttribute(positions, { includeBounds: true })
    const normalAccessor = addFloatAttribute(normals)

    const meshIndex = meshes.length
    meshes.push({
      name: part.fileName,
      primitives: [{
        attributes: { POSITION: positionAccessor, NORMAL: normalAccessor },
        material: 0,
        mode: 4,
      }],
      extras: {
        sourcePart: part.id,
        sourceFileName: part.fileName,
        sourceGitBlobSha: part.gitBlobSha,
      },
    })
    nodes.push({
      name: part.fileName,
      mesh: meshIndex,
      extras: {
        sourcePart: part.id,
        sourceFileName: part.fileName,
        sourceGitBlobSha: part.gitBlobSha,
      },
    })
  }

  const binary = Buffer.concat(binaryChunks)
  const gltf = {
    asset: {
      version: '2.0',
      generator: 'Rocket Anatomy Lab Phase 16 NASA STL package converter',
      extras: {
        sourceKind: 'NASA multi-part STL',
        sourcePageUrl: asset.sourcePageUrl,
        sourceLabel: asset.sourceLabel,
        approximatePlacement: true,
      },
    },
    scene: 0,
    scenes: [{ name: asset.id, nodes: nodes.map((_, index) => index) }],
    nodes,
    meshes,
    materials,
    buffers: [{ byteLength: binary.length }],
    bufferViews,
    accessors,
  }

  const jsonBytes = Buffer.from(JSON.stringify(gltf), 'utf8')
  const paddedJsonLength = align4(jsonBytes.length)
  const paddedBinLength = align4(binary.length)
  const totalLength = 12 + 8 + paddedJsonLength + 8 + paddedBinLength
  const out = Buffer.alloc(totalLength)

  out.writeUInt32LE(0x46546c67, 0)
  out.writeUInt32LE(2, 4)
  out.writeUInt32LE(totalLength, 8)

  out.writeUInt32LE(paddedJsonLength, 12)
  out.writeUInt32LE(0x4e4f534a, 16)
  jsonBytes.copy(out, 20)
  out.fill(0x20, 20 + jsonBytes.length, 20 + paddedJsonLength)

  const binHeader = 20 + paddedJsonLength
  out.writeUInt32LE(paddedBinLength, binHeader)
  out.writeUInt32LE(0x004e4942, binHeader + 4)
  binary.copy(out, binHeader + 8)

  return out
}

const inspectGlb = (buffer, asset) => {
  const errors = []
  if (buffer.length < 20) return { errors: ['generated GLB is too small'] }
  if (buffer.readUInt32LE(0) !== 0x46546c67) errors.push('invalid generated GLB magic')
  if (buffer.readUInt32LE(4) !== 2) errors.push('generated GLB version must be 2')
  if (buffer.readUInt32LE(8) !== buffer.length) errors.push('generated GLB declared length mismatch')

  const jsonLength = buffer.readUInt32LE(12)
  const jsonType = buffer.readUInt32LE(16)
  if (jsonType !== 0x4e4f534a) errors.push('first generated GLB chunk must be JSON')
  let json = null
  try {
    json = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength).trimEnd())
  } catch (error) {
    errors.push(`generated GLB JSON parse failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (json) {
    if (json.nodes?.length !== asset.partCount) errors.push(`generated node count expected ${asset.partCount}, got ${json.nodes?.length ?? 0}`)
    if (json.meshes?.length !== asset.partCount) errors.push(`generated mesh count expected ${asset.partCount}, got ${json.meshes?.length ?? 0}`)
    const sourceParts = new Set((json.nodes ?? []).map(node => node.extras?.sourcePart).filter(Boolean))
    for (const part of asset.sourceParts) {
      if (!sourceParts.has(part.id)) errors.push(`generated GLB missing source part ${part.id}`)
    }
    const positionCounts = (json.meshes ?? []).map(mesh => {
      const accessorIndex = mesh.primitives?.[0]?.attributes?.POSITION
      return json.accessors?.[accessorIndex]?.count ?? 0
    })
    if (positionCounts.some(count => count < 3)) errors.push('generated GLB contains empty mesh positions')
  }

  return { errors, json }
}

const loader = new STLLoader()
const results = []

for (const asset of generatedStageDetailAssets) {
  try {
    const parsedParts = []
    const sourceResults = []

    for (const part of asset.sourceParts) {
      const accepted = await fetchPinnedPart(asset, part)
      const geometry = loader.parse(toArrayBuffer(accepted.buffer))
      parsedParts.push({ part, geometry })
      sourceResults.push({
        id: part.id,
        byteLength: accepted.buffer.length,
        gitBlobSha: accepted.actualBlobSha,
        triangles: geometry.getAttribute('position')?.count / 3 ?? 0,
      })
    }

    const glb = packStageGlb(asset, parsedParts)
    const qualification = inspectGlb(glb, asset)
    for (const { geometry } of parsedParts) geometry.dispose()
    if (qualification.errors.length) throw new Error(qualification.errors.join('; '))

    const target = path.join(root, 'public', asset.localUrl.replace(/^\.\//, ''))
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, glb)

    results.push({
      id: asset.id,
      status: 'PASS',
      target: path.relative(root, target).replaceAll('\\', '/'),
      outputByteLength: glb.length,
      partCount: asset.partCount,
      sources: sourceResults,
    })
  } catch (error) {
    results.push({
      id: asset.id,
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const failed = results.filter(result => result.status !== 'PASS')
console.log(JSON.stringify({ status: failed.length ? 'FAIL' : 'PASS', results }, null, 2))
if (failed.length) process.exit(2)
