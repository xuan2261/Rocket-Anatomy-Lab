import crypto from 'node:crypto'

const GLB_MAGIC = 0x46546c67
const JSON_CHUNK = 0x4e4f534a
const BIN_CHUNK = 0x004e4942
const TRIANGLES = 4

const componentSize = new Map([
  [5120, 1], [5121, 1], [5122, 2], [5123, 2], [5125, 4], [5126, 4],
])
const typeComponents = new Map([
  ['SCALAR', 1], ['VEC2', 2], ['VEC3', 3], ['VEC4', 4], ['MAT2', 4], ['MAT3', 9], ['MAT4', 16],
])

export const githubBlobSha = buffer => {
  const header = Buffer.from(`blob ${buffer.length}\0`)
  return crypto.createHash('sha1').update(header).update(buffer).digest('hex')
}

export const parseGlb = buffer => {
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer)
  if (buffer.length < 20) throw new Error('GLB is too small')
  if (buffer.readUInt32LE(0) !== GLB_MAGIC) throw new Error('Invalid GLB magic')
  const version = buffer.readUInt32LE(4)
  if (version !== 2) throw new Error(`Unsupported GLB version: ${version}`)
  const declaredLength = buffer.readUInt32LE(8)
  if (declaredLength !== buffer.length) throw new Error(`GLB length mismatch: header=${declaredLength}, actual=${buffer.length}`)

  let offset = 12
  let json = null
  let bin = Buffer.alloc(0)
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset)
    const chunkType = buffer.readUInt32LE(offset + 4)
    offset += 8
    if (offset + chunkLength > buffer.length) throw new Error('GLB chunk exceeds file length')
    const chunk = buffer.subarray(offset, offset + chunkLength)
    offset += chunkLength
    if (chunkType === JSON_CHUNK) {
      const text = chunk.toString('utf8').replace(/\u0000+$/g, '').trim()
      json = JSON.parse(text)
    } else if (chunkType === BIN_CHUNK) {
      bin = Buffer.from(chunk)
    }
  }
  if (!json) throw new Error('GLB JSON chunk missing')
  return { json, bin }
}

const padded = (buffer, byte = 0) => {
  const pad = (4 - (buffer.length % 4)) % 4
  return pad ? Buffer.concat([buffer, Buffer.alloc(pad, byte)]) : buffer
}

export const encodeGlb = ({ json, bin }) => {
  const jsonBuffer = padded(Buffer.from(JSON.stringify(json), 'utf8'), 0x20)
  const binBuffer = padded(Buffer.from(bin), 0x00)
  const totalLength = 12 + 8 + jsonBuffer.length + (binBuffer.length ? 8 + binBuffer.length : 0)
  const out = Buffer.alloc(totalLength)
  out.writeUInt32LE(GLB_MAGIC, 0)
  out.writeUInt32LE(2, 4)
  out.writeUInt32LE(totalLength, 8)
  let offset = 12
  out.writeUInt32LE(jsonBuffer.length, offset)
  out.writeUInt32LE(JSON_CHUNK, offset + 4)
  jsonBuffer.copy(out, offset + 8)
  offset += 8 + jsonBuffer.length
  if (binBuffer.length) {
    out.writeUInt32LE(binBuffer.length, offset)
    out.writeUInt32LE(BIN_CHUNK, offset + 4)
    binBuffer.copy(out, offset + 8)
  }
  return out
}

const dataViewFor = buffer => new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)

const readComponent = (view, offset, type) => {
  if (type === 5120) return view.getInt8(offset)
  if (type === 5121) return view.getUint8(offset)
  if (type === 5122) return view.getInt16(offset, true)
  if (type === 5123) return view.getUint16(offset, true)
  if (type === 5125) return view.getUint32(offset, true)
  if (type === 5126) return view.getFloat32(offset, true)
  throw new Error(`Unsupported accessor componentType ${type}`)
}

const writeIndexBuffer = (values, componentType) => {
  const bytes = componentSize.get(componentType)
  if (![5121, 5123, 5125].includes(componentType) || !bytes) {
    throw new Error(`Unsupported index componentType ${componentType}`)
  }
  const out = Buffer.alloc(values.length * bytes)
  for (let index = 0; index < values.length; index += 1) {
    const offset = index * bytes
    if (componentType === 5121) out.writeUInt8(values[index], offset)
    else if (componentType === 5123) out.writeUInt16LE(values[index], offset)
    else out.writeUInt32LE(values[index], offset)
  }
  return out
}

const minMax = values => {
  let min = Infinity
  let max = -Infinity
  for (const value of values) {
    if (value < min) min = value
    if (value > max) max = value
  }
  return [min, max]
}

const accessorReader = (json, bin, accessorIndex) => {
  const accessor = json.accessors?.[accessorIndex]
  if (!accessor) throw new Error(`Missing accessor ${accessorIndex}`)
  if (accessor.sparse) throw new Error(`Sparse accessor ${accessorIndex} is not supported by the assembly re-authorer`)
  const viewDef = json.bufferViews?.[accessor.bufferView]
  if (!viewDef) throw new Error(`Accessor ${accessorIndex} has no bufferView`)
  if ((viewDef.buffer ?? 0) !== 0) throw new Error('Assembly re-authorer supports one embedded GLB buffer')
  const components = typeComponents.get(accessor.type)
  const bytesPerComponent = componentSize.get(accessor.componentType)
  if (!components || !bytesPerComponent) throw new Error(`Unsupported accessor layout ${accessor.type}/${accessor.componentType}`)
  const elementSize = components * bytesPerComponent
  const stride = viewDef.byteStride ?? elementSize
  const base = (viewDef.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const view = dataViewFor(bin)
  const read = index => {
    if (index < 0 || index >= accessor.count) throw new Error(`Accessor ${accessorIndex} index out of range: ${index}`)
    const item = []
    const start = base + index * stride
    for (let component = 0; component < components; component += 1) {
      item.push(readComponent(view, start + component * bytesPerComponent, accessor.componentType))
    }
    return item
  }
  return { accessor, read }
}

const primitiveIndices = (json, bin, primitive) => {
  const positionAccessorIndex = primitive.attributes?.POSITION
  if (positionAccessorIndex == null) throw new Error('Primitive has no POSITION accessor')
  const positions = accessorReader(json, bin, positionAccessorIndex)
  if (positions.accessor.type !== 'VEC3') throw new Error('POSITION accessor must be VEC3')
  if (primitive.indices == null) return { values: Array.from({ length: positions.accessor.count }, (_, i) => i), componentType: positions.accessor.count > 65535 ? 5125 : 5123 }
  const indices = accessorReader(json, bin, primitive.indices)
  if (indices.accessor.type !== 'SCALAR') throw new Error('Index accessor must be SCALAR')
  return {
    values: Array.from({ length: indices.accessor.count }, (_, i) => indices.read(i)[0]),
    componentType: indices.accessor.componentType,
  }
}

const identityNode = node => {
  if (node.matrix) return node.matrix.every((value, index) => Math.abs(value - ([0, 5, 10, 15].includes(index) ? 1 : 0)) < 1e-9)
  const translationOk = !node.translation || node.translation.every(value => Math.abs(value) < 1e-9)
  const rotationOk = !node.rotation || node.rotation.every((value, index) => Math.abs(value - (index === 3 ? 1 : 0)) < 1e-9)
  const scaleOk = !node.scale || node.scale.every(value => Math.abs(value - 1) < 1e-9)
  return translationOk && rotationOk && scaleOk
}

const renderableNodes = json => (json.nodes ?? []).filter(node => node.mesh != null)

const classify = (manifest, normalized) => {
  const t = Math.max(0, Math.min(1, normalized))
  const index = manifest.segments.findIndex((segment, i) => t >= segment.start && (t < segment.end || (i === manifest.segments.length - 1 && t <= segment.end)))
  if (index < 0) throw new Error(`No assembly segment covers normalized position ${t}`)
  return index
}

const appendIndexAccessor = (json, binParts, cursor, indices, componentType) => {
  const raw = writeIndexBuffer(indices, componentType)
  const alignedOffset = (cursor.value + 3) & ~3
  const pad = alignedOffset - cursor.value
  if (pad) binParts.push(Buffer.alloc(pad))
  const byteOffset = alignedOffset
  binParts.push(raw)
  cursor.value = byteOffset + raw.length
  const bufferView = json.bufferViews.length
  json.bufferViews.push({ buffer: 0, byteOffset, byteLength: raw.length, target: 34963 })
  const accessor = json.accessors.length
  const [minIndex, maxIndex] = minMax(indices)
  json.accessors.push({
    bufferView,
    byteOffset: 0,
    componentType,
    count: indices.length,
    type: 'SCALAR',
    min: [minIndex],
    max: [maxIndex],
  })
  return accessor
}

export const reauthorAssemblyGlb = (sourceBuffer, manifest, options = {}) => {
  const sourceSha = githubBlobSha(sourceBuffer)
  if (options.enforceGitSha !== false && sourceSha !== manifest.source.gitSha) {
    throw new Error(`Source GLB Git blob SHA mismatch: expected ${manifest.source.gitSha}, got ${sourceSha}`)
  }
  const { json: sourceJson, bin: sourceBin } = parseGlb(sourceBuffer)
  const json = structuredClone(sourceJson)
  if ((json.buffers?.length ?? 0) !== 1) throw new Error('Assembly re-authorer requires exactly one GLB buffer')
  if ((json.skins?.length ?? 0) > 0) throw new Error('Skinned assets are not supported by this educational assembly pipeline')
  for (const node of json.nodes ?? []) {
    if (!identityNode(node)) throw new Error(`Source node ${node.name || '(unnamed)'} has a non-identity transform; bake transforms before re-authoring`)
  }

  const axisIndex = manifest.source.primaryAxis === 'x' ? 0 : manifest.source.primaryAxis === 'y' ? 1 : 2
  const axisMin = manifest.source.bounds.min[axisIndex]
  const axisMax = manifest.source.bounds.max[axisIndex]
  const axisSpan = axisMax - axisMin
  if (!(axisSpan > 0)) throw new Error('Assembly source axis has no positive span')

  const perSegmentPrimitives = manifest.segments.map(() => [])
  const triangleCounts = manifest.segments.map(() => 0)
  const originalMeshes = sourceJson.meshes ?? []
  const sourceNodes = sourceJson.nodes ?? []

  for (const node of sourceNodes) {
    if (node.mesh == null) continue
    const mesh = originalMeshes[node.mesh]
    if (!mesh) throw new Error(`Missing source mesh ${node.mesh}`)
    for (let primitiveIndex = 0; primitiveIndex < (mesh.primitives ?? []).length; primitiveIndex += 1) {
      const primitive = mesh.primitives[primitiveIndex]
      const mode = primitive.mode ?? TRIANGLES
      if (mode !== TRIANGLES) throw new Error(`Only TRIANGLES primitives are supported; found mode ${mode}`)
      if (primitive.targets?.length) throw new Error('Morph targets are not supported by the educational assembly pipeline')
      const positionAccessorIndex = primitive.attributes?.POSITION
      const positions = accessorReader(sourceJson, sourceBin, positionAccessorIndex)
      if (positions.accessor.componentType !== 5126) throw new Error('POSITION accessors must use FLOAT components')
      if (primitive.extensions?.KHR_draco_mesh_compression) throw new Error('Draco-compressed primitives must be decoded before re-authoring')
      const { values: indices, componentType } = primitiveIndices(sourceJson, sourceBin, primitive)
      if (indices.length % 3 !== 0) throw new Error(`Primitive index count is not divisible by 3 in ${node.name || 'unnamed node'}`)
      const perSegmentIndices = manifest.segments.map(() => [])
      for (let offset = 0; offset < indices.length; offset += 3) {
        const a = positions.read(indices[offset])
        const b = positions.read(indices[offset + 1])
        const c = positions.read(indices[offset + 2])
        const centroid = (a[axisIndex] + b[axisIndex] + c[axisIndex]) / 3
        const normalized = Math.max(0, Math.min(1, (centroid - axisMin) / axisSpan))
        const segmentIndex = classify(manifest, normalized)
        perSegmentIndices[segmentIndex].push(indices[offset], indices[offset + 1], indices[offset + 2])
      }
      for (let segmentIndex = 0; segmentIndex < perSegmentIndices.length; segmentIndex += 1) {
        const filtered = perSegmentIndices[segmentIndex]
        if (!filtered.length) continue
        perSegmentPrimitives[segmentIndex].push({ primitive, filtered, componentType, sourceNodeName: node.name || '', sourceMeshIndex: node.mesh, sourcePrimitiveIndex: primitiveIndex })
        triangleCounts[segmentIndex] += filtered.length / 3
      }
    }
  }

  if (triangleCounts.some(count => count === 0)) {
    const empty = manifest.segments.filter((_, i) => triangleCounts[i] === 0).map(segment => segment.id)
    throw new Error(`Assembly partition produced empty segment(s): ${empty.join(', ')}`)
  }

  json.accessors ??= []
  json.bufferViews ??= []
  const binParts = [Buffer.from(sourceBin)]
  const cursor = { value: sourceBin.length }
  const newMeshes = []
  for (let segmentIndex = 0; segmentIndex < manifest.segments.length; segmentIndex += 1) {
    const segment = manifest.segments[segmentIndex]
    const primitives = []
    for (const fragment of perSegmentPrimitives[segmentIndex]) {
      const indicesAccessor = appendIndexAccessor(json, binParts, cursor, fragment.filtered, fragment.componentType)
      const next = {
        attributes: { ...fragment.primitive.attributes },
        indices: indicesAccessor,
        mode: TRIANGLES,
        extras: {
          ...(fragment.primitive.extras ?? {}),
          rocketAssemblyId: segment.id,
          rocketSourceNode: fragment.sourceNodeName,
          rocketSourceMesh: fragment.sourceMeshIndex,
          rocketSourcePrimitive: fragment.sourcePrimitiveIndex,
        },
      }
      if (fragment.primitive.material != null) next.material = fragment.primitive.material
      if (fragment.primitive.extensions) next.extensions = structuredClone(fragment.primitive.extensions)
      primitives.push(next)
    }
    newMeshes.push({
      name: `${segment.id}-mesh`,
      primitives,
      extras: { rocketAssemblyId: segment.id, triangleCount: triangleCounts[segmentIndex] },
    })
  }

  json.meshes = newMeshes
  json.nodes = [
    {
      name: 'saturn-v-education-assembly',
      children: manifest.segments.map((_, i) => i + 1),
      extras: { rocketAnatomyLabRoot: true, manifestId: manifest.id, educationalOnly: true },
    },
    ...manifest.segments.map((segment, index) => ({
      name: segment.id,
      mesh: index,
      extras: {
        rocketAssemblyId: segment.id,
        label: segment.label,
        normalizedRange: [segment.start, segment.end],
        explodeSignedFactor: segment.explodeSignedFactor,
        educationalOnly: true,
      },
    })),
  ]
  json.scenes = [{ name: 'Rocket Anatomy Lab Assembly Scene', nodes: [0] }]
  json.scene = 0
  delete json.animations
  delete json.skins
  delete json.cameras
  json.asset ??= { version: '2.0' }
  json.asset.extras = {
    ...(json.asset.extras ?? {}),
    rocketAnatomyLabAssembly: {
      version: 1,
      manifestId: manifest.id,
      sourceRepository: manifest.source.repository,
      sourcePath: manifest.source.path,
      sourceGitSha: manifest.source.gitSha,
      sourceBlobShaObserved: sourceSha,
      methodology: manifest.methodology,
      primaryAxis: manifest.source.primaryAxis,
      educationalOnly: true,
      historicalStageBoundaries: false,
    },
  }

  const bin = Buffer.concat(binParts)
  json.buffers[0].byteLength = bin.length
  const output = encodeGlb({ json, bin })
  return {
    output,
    summary: {
      sourceBlobSha: sourceSha,
      manifestId: manifest.id,
      segmentCount: manifest.segments.length,
      triangleCounts: Object.fromEntries(manifest.segments.map((segment, i) => [segment.id, triangleCounts[i]])),
      outputBytes: output.length,
    },
  }
}

export const qualifyAssemblyGlb = (buffer, manifest) => {
  const errors = []
  let parsed
  try { parsed = parseGlb(buffer) } catch (error) { return { errors: [String(error.message ?? error)] } }
  const { json } = parsed
  const meta = json.asset?.extras?.rocketAnatomyLabAssembly
  if (!meta) errors.push('rocketAnatomyLabAssembly metadata missing')
  if (meta?.manifestId !== manifest.id) errors.push(`manifestId mismatch: ${meta?.manifestId ?? 'missing'}`)
  if (meta?.educationalOnly !== true) errors.push('educationalOnly metadata missing')
  if (meta?.historicalStageBoundaries !== false) errors.push('historicalStageBoundaries must be false')
  const nodes = (json.nodes ?? []).filter(node => node.extras?.rocketAssemblyId)
  const ids = nodes.map(node => node.extras.rocketAssemblyId)
  const expected = manifest.segments.map(segment => segment.id)
  if (nodes.length !== expected.length) errors.push(`expected ${expected.length} assembly nodes, found ${nodes.length}`)
  for (const id of expected) if (!ids.includes(id)) errors.push(`missing assembly node: ${id}`)
  for (const id of ids) if (!expected.includes(id)) errors.push(`unexpected assembly node: ${id}`)
  for (const node of nodes) {
    const mesh = json.meshes?.[node.mesh]
    if (!mesh?.primitives?.length) errors.push(`${node.extras.rocketAssemblyId}: no mesh primitives`)
    if ((mesh?.extras?.triangleCount ?? 0) <= 0) errors.push(`${node.extras.rocketAssemblyId}: triangleCount must be > 0`)
  }
  return {
    errors,
    assemblyNodeCount: nodes.length,
    assemblyIds: ids,
    sourceGitSha: meta?.sourceGitSha ?? null,
    methodology: meta?.methodology ?? null,
  }
}
