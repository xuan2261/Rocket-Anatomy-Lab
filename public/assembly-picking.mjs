import { Box3, Sphere, Vector3 } from 'three'

/**
 * Recompute bounds from referenced vertices in the static educational GLB.
 * Partitioned primitives share POSITION buffers; unused vertices must not
 * enlarge camera focus, annotation anchors or raycast broad-phase bounds.
 * Call after loading, before mapping groups. Vertex/index data stay unchanged.
 */
export function updateStaticIndexedBounds(root) {
  const visited = new Set()
  const vertex = new Vector3()
  root.traverse(object => {
    if (!object.isMesh || visited.has(object.geometry)) return
    const geometry = object.geometry
    visited.add(geometry)
    const positions = geometry.getAttribute('position')
    if (!positions) return
    if (object.isSkinnedMesh || Object.keys(geometry.morphAttributes).length) {
      throw new Error('Educational assembly bounds require static geometry')
    }
    const index = geometry.getIndex()
    const available = index ? index.count : positions.count
    const start = Math.max(0, geometry.drawRange.start)
    const end = Math.min(available, start + geometry.drawRange.count)
    const box = new Box3()
    for (let offset = start; offset < end; offset += 1) {
      const positionIndex = index ? index.getX(offset) : offset
      vertex.fromBufferAttribute(positions, positionIndex)
      if (!Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) || !Number.isFinite(vertex.z)) {
        throw new Error('Educational assembly contains invalid indexed positions')
      }
      box.expandByPoint(vertex)
    }
    geometry.boundingBox = box
    geometry.boundingSphere = box.getBoundingSphere(new Sphere())
  })
}

/** Raycast only renderable assembly meshes, excluding hidden subtrees. */
export function firstVisibleAssemblyHit(raycaster, root) {
  const candidates = []
  root.traverseVisible(object => {
    if (!object.isMesh || typeof object.userData.rocketGroupId !== 'string') return
    if (object.userData.rocketSectionStencil || object.userData.rocketSectionCap) return
    candidates.push(object)
  })
  return raycaster.intersectObjects(candidates, false).find(hit => {
    const material = Array.isArray(hit.object.material)
      ? hit.object.material[hit.face?.materialIndex ?? 0]
      : hit.object.material
    return material?.visible !== false
  }) ?? null
}
