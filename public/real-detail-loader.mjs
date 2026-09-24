import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { detailAssetForNode } from './core/detailAssets.js'

const cloneMaterials = root => {
  root.traverse(object => {
    if (!object.isMesh || !object.material) return
    object.material = Array.isArray(object.material)
      ? object.material.map(material => material.clone())
      : object.material.clone()
  })
}

const disposeObject = root => {
  const geometries = new Set()
  const materials = new Set()
  const textures = new Set()
  root.traverse(object => {
    if (!object.isMesh) return
    if (object.geometry) geometries.add(object.geometry)
    const owned = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of owned) {
      if (!material) continue
      materials.add(material)
      for (const value of Object.values(material)) {
        if (value?.isTexture) textures.add(value)
      }
    }
  })
  for (const texture of textures) texture.dispose?.()
  for (const material of materials) material.dispose?.()
  for (const geometry of geometries) geometry.dispose?.()
}

const sourcePartForObject = object => {
  let cursor = object
  while (cursor) {
    if (cursor.userData?.sourcePart) return cursor.userData.sourcePart
    cursor = cursor.parent
  }
  return null
}

const triangleCountForGeometry = geometry => {
  if (!geometry) return 0
  if (geometry.index) return Math.floor(geometry.index.count / 3)
  const position = geometry.getAttribute?.('position')
  return position ? Math.floor(position.count / 3) : 0
}

export function createRealDetailLoader({ scene, modelBox, sectionPlane }) {
  if (!scene || !modelBox || modelBox.isEmpty()) throw new Error('Real detail loader requires a scene and non-empty model box')

  const loader = new GLTFLoader()
  const cache = new Map()
  const resolvedByNode = new Map()
  let sectionEnabled = false
  let activeNodeId = null
  let selectedHelper = null
  let hoverHelper = null

  const modelSize = modelBox.getSize(new THREE.Vector3())
  const modelCenter = modelBox.getCenter(new THREE.Vector3())
  const modelExtent = Math.max(modelSize.x, modelSize.y, modelSize.z)

  const disposeHelper = helper => {
    if (!helper) return null
    helper.removeFromParent()
    helper.dispose?.()
    return null
  }

  const clearPartHelpers = () => {
    selectedHelper = disposeHelper(selectedHelper)
    hoverHelper = disposeHelper(hoverHelper)
  }

  const applyClipping = root => {
    root.traverse(object => {
      if (!object.isMesh || !object.material) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of materials) {
        material.clippingPlanes = sectionEnabled ? [sectionPlane] : []
        material.needsUpdate = true
      }
    })
  }

  const fitToAnchor = (root, asset) => {
    // Package placement only needs a stable aggregate bound. Keep precise bounds
    // for individual inspector parts, where the additional traversal is useful.
    root.updateMatrixWorld(true)
    const sourceBox = new THREE.Box3().setFromObject(root)
    if (sourceBox.isEmpty()) throw new Error(`${asset.id}: loaded detail asset has empty bounds`)
    const sourceSize = sourceBox.getSize(new THREE.Vector3())
    const sourceExtent = Math.max(sourceSize.x, sourceSize.y, sourceSize.z)
    if (!Number.isFinite(sourceExtent) || sourceExtent <= 0) throw new Error(`${asset.id}: invalid detail bounds`)

    const targetExtent = modelExtent * asset.fit.targetSizeNormalized
    const scale = targetExtent / sourceExtent
    root.scale.setScalar(scale)
    root.updateMatrixWorld(true)

    const scaledBox = new THREE.Box3().setFromObject(root)
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3())
    const targetCenter = modelCenter.clone()
    targetCenter.y = THREE.MathUtils.lerp(modelBox.min.y, modelBox.max.y, asset.fit.centerNormalized)
    root.position.add(targetCenter.sub(scaledCenter))
    root.updateMatrixWorld(true)
  }

  const tagDetail = (root, asset) => {
    root.userData.isQualifiedRealDetail = true
    root.userData.detailAssetId = asset.id
    root.userData.anatomyNodeId = asset.anatomyNodeId
    root.userData.detailSourceKind = asset.sourceKind
    root.traverse(object => {
      object.userData.isQualifiedRealDetail = true
      object.userData.detailAssetId = asset.id
      object.userData.anatomyNodeId = asset.anatomyNodeId
      object.userData.detailSourceKind = asset.sourceKind
    })
  }

  const preparePartMetadata = (root, asset) => {
    if (asset.sourceKind !== 'generated-stl-package') {
      return {
        parts: new Map(),
        packageExtent: 0,
        selectedPartId: null,
        ghostOthersPartId: null,
        onlyPartId: null,
      }
    }

    root.updateWorldMatrix(true, true)
    const packageBox = new THREE.Box3().setFromObject(root, true)
    const packageCenter = packageBox.getCenter(new THREE.Vector3())
    const packageSize = packageBox.getSize(new THREE.Vector3())
    const packageExtent = Math.max(packageSize.x, packageSize.y, packageSize.z)
    const parts = new Map()
    let fallbackIndex = 0

    root.traverse(object => {
      if (!object.isMesh) return
      const sourcePart = sourcePartForObject(object)
      if (!sourcePart) return

      let meta = parts.get(sourcePart)
      if (!meta) {
        const partBox = new THREE.Box3().setFromObject(object, true)
        const partCenter = partBox.getCenter(new THREE.Vector3())
        const direction = partCenter.sub(packageCenter)
        if (direction.lengthSq() < 1e-10) {
          direction.set(
            fallbackIndex % 2 === 0 ? 1 : -1,
            (fallbackIndex % 3) - 1,
            fallbackIndex % 2 === 0 ? 0.55 : -0.55,
          )
        }
        fallbackIndex += 1
        direction.normalize()

        meta = {
          id: sourcePart,
          object,
          basePosition: object.position.clone(),
          direction,
          meshes: [],
          materialStates: new Map(),
          userVisible: true,
        }
        parts.set(sourcePart, meta)
      }

      meta.meshes.push(object)
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of materials) {
        if (!material || meta.materialStates.has(material)) continue
        meta.materialStates.set(material, {
          opacity: material.opacity,
          transparent: material.transparent,
          depthWrite: material.depthWrite,
        })
      }
    })

    return {
      parts,
      packageExtent,
      selectedPartId: null,
      ghostOthersPartId: null,
      onlyPartId: null,
    }
  }

  const applyVisibility = loaded => {
    for (const [partId, meta] of loaded.partMeta.parts) {
      const visible = meta.userVisible && (!loaded.partMeta.onlyPartId || loaded.partMeta.onlyPartId === partId)
      for (const mesh of meta.meshes) mesh.visible = visible
    }
  }

  const applyGhosting = loaded => {
    const selected = loaded.partMeta.ghostOthersPartId
    for (const [partId, meta] of loaded.partMeta.parts) {
      const ghosted = Boolean(selected && selected !== partId)
      for (const [material, base] of meta.materialStates) {
        material.opacity = ghosted ? Math.min(base.opacity, 0.18) : base.opacity
        material.transparent = ghosted ? true : base.transparent
        material.depthWrite = ghosted ? false : base.depthWrite
        material.needsUpdate = true
      }
    }
  }

  const updateHelper = (kind, object) => {
    if (kind === 'selected') selectedHelper = disposeHelper(selectedHelper)
    else hoverHelper = disposeHelper(hoverHelper)
    if (!object) return

    const helper = new THREE.BoxHelper(object, kind === 'selected' ? 0x4f9cff : 0xa9d1ff)
    helper.name = kind === 'selected' ? 'RealDetailSelectedPartHelper' : 'RealDetailHoverPartHelper'
    helper.userData.isDetailInspectorHelper = true
    scene.add(helper)
    if (kind === 'selected') selectedHelper = helper
    else hoverHelper = helper
  }

  const loadedForNodeSync = nodeId => resolvedByNode.get(nodeId) ?? null

  const loadedForNode = async nodeId => {
    const resolved = loadedForNodeSync(nodeId)
    if (resolved) return resolved
    const asset = detailAssetForNode(nodeId)
    if (!asset) return null
    const entry = cache.get(asset.id)
    return entry ? entry.promise.catch(() => null) : null
  }

  const loadForNode = async nodeId => {
    const asset = detailAssetForNode(nodeId)
    if (!asset) return null

    let entry = cache.get(asset.id)
    if (!entry) {
      const promise = loader.loadAsync(asset.localUrl).then(gltf => {
        const root = gltf.scene
        root.name = `QualifiedDetail:${asset.id}`
        cloneMaterials(root)
        tagDetail(root, asset)
        fitToAnchor(root, asset)
        const partMeta = preparePartMetadata(root, asset)
        applyClipping(root)
        root.visible = false
        scene.add(root)
        const loaded = { asset, root, gltf, partMeta, explode: 0 }
        resolvedByNode.set(asset.anatomyNodeId, loaded)
        return loaded
      }).catch(error => {
        cache.delete(asset.id)
        throw error
      })
      entry = { promise }
      cache.set(asset.id, entry)
    }

    const loaded = await entry.promise
    clearPartHelpers()
    for (const cached of cache.values()) {
      const other = await cached.promise.catch(() => null)
      if (other?.root) other.root.visible = other.asset.id === loaded.asset.id
    }
    activeNodeId = nodeId
    loaded.root.visible = true
    return loaded
  }

  const hideAll = async () => {
    activeNodeId = null
    clearPartHelpers()
    for (const entry of cache.values()) {
      const loaded = await entry.promise.catch(() => null)
      if (loaded?.root) loaded.root.visible = false
    }
  }

  const setSectionEnabled = enabled => {
    sectionEnabled = Boolean(enabled)
    for (const entry of cache.values()) {
      entry.promise.then(loaded => applyClipping(loaded.root)).catch(() => {})
    }
  }

  const setExplode = async (nodeId, value) => {
    const loaded = await loadedForNode(nodeId)
    if (!loaded) return false
    const amount = THREE.MathUtils.clamp(Number(value) || 0, 0, 1)
    loaded.explode = amount

    const distance = loaded.partMeta.packageExtent * 0.16 * amount
    for (const meta of loaded.partMeta.parts.values()) {
      meta.object.position.copy(meta.basePosition)
      meta.object.position.addScaledVector(meta.direction, distance)
    }
    loaded.root.updateWorldMatrix(true, true)
    selectedHelper?.update?.()
    hoverHelper?.update?.()
    return true
  }

  const setPartVisible = async (nodeId, partId, visible) => {
    const loaded = await loadedForNode(nodeId)
    const meta = loaded?.partMeta.parts.get(partId)
    if (!meta) return false
    meta.userVisible = Boolean(visible)
    applyVisibility(loaded)
    if (!meta.userVisible && loaded.partMeta.selectedPartId === partId) updateHelper('selected', null)
    if (!meta.userVisible) updateHelper('hover', null)
    return true
  }

  const setSelectedPart = (nodeId, partId) => {
    const loaded = loadedForNodeSync(nodeId)
    const meta = loaded?.partMeta.parts.get(partId)
    if (!loaded || !meta) {
      if (loaded) loaded.partMeta.selectedPartId = null
      updateHelper('selected', null)
      return false
    }
    loaded.partMeta.selectedPartId = partId
    updateHelper('selected', meta.object)
    return true
  }

  const setHoveredPart = (nodeId, partId) => {
    const loaded = loadedForNodeSync(nodeId)
    const meta = loaded?.partMeta.parts.get(partId)
    if (!loaded || !meta || partId === loaded.partMeta.selectedPartId) {
      updateHelper('hover', null)
      return false
    }
    updateHelper('hover', meta.object)
    return true
  }

  const setGhostOtherParts = async (nodeId, partId, enabled) => {
    const loaded = await loadedForNode(nodeId)
    if (!loaded || !loaded.partMeta.parts.has(partId)) return false
    loaded.partMeta.ghostOthersPartId = enabled ? partId : null
    applyGhosting(loaded)
    return true
  }

  const setOnlyPartVisible = async (nodeId, partId, enabled) => {
    const loaded = await loadedForNode(nodeId)
    if (!loaded || !loaded.partMeta.parts.has(partId)) return false
    loaded.partMeta.onlyPartId = enabled ? partId : null
    applyVisibility(loaded)
    return true
  }

  const getPartObject = (nodeId, partId) => {
    const loaded = loadedForNodeSync(nodeId)
    return loaded?.partMeta.parts.get(partId)?.object ?? null
  }

  const getPartStats = (nodeId, partId) => {
    const loaded = loadedForNodeSync(nodeId)
    const meta = loaded?.partMeta.parts.get(partId)
    if (!meta) return null

    meta.object.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(meta.object, true)
    const size = box.getSize(new THREE.Vector3())
    let triangles = 0
    let estimatedDrawCalls = 0
    for (const mesh of meta.meshes) {
      triangles += triangleCountForGeometry(mesh.geometry)
      estimatedDrawCalls += Math.max(mesh.geometry?.groups?.length || 1, 1)
    }
    return {
      partId,
      meshCount: meta.meshes.length,
      triangles,
      estimatedDrawCalls,
      bounds: { x: size.x, y: size.y, z: size.z },
    }
  }

  const pickPart = raycaster => {
    const loaded = activeNodeId ? loadedForNodeSync(activeNodeId) : null
    if (!loaded || loaded.asset.sourceKind !== 'generated-stl-package' || !loaded.root.visible) return null
    const hit = raycaster.intersectObject(loaded.root, true).find(item => {
      const partId = sourcePartForObject(item.object)
      const meta = partId ? loaded.partMeta.parts.get(partId) : null
      return Boolean(partId && meta?.userVisible && item.object.visible)
    })
    if (!hit) return null
    const partId = sourcePartForObject(hit.object)
    return partId ? { nodeId: activeNodeId, partId, object: hit.object, point: hit.point } : null
  }

  const resetNode = async nodeId => {
    const loaded = await loadedForNode(nodeId)
    if (!loaded) return false
    await setExplode(nodeId, 0)
    loaded.partMeta.ghostOthersPartId = null
    loaded.partMeta.onlyPartId = null
    loaded.partMeta.selectedPartId = null
    for (const meta of loaded.partMeta.parts.values()) meta.userVisible = true
    applyGhosting(loaded)
    applyVisibility(loaded)
    clearPartHelpers()
    return true
  }

  const resetAll = async () => {
    for (const entry of cache.values()) {
      const loaded = await entry.promise.catch(() => null)
      if (!loaded) continue
      await resetNode(loaded.asset.anatomyNodeId)
      loaded.root.visible = false
    }
    activeNodeId = null
  }

  const hasDetail = nodeId => Boolean(detailAssetForNode(nodeId))
  const isLoaded = nodeId => Boolean(loadedForNodeSync(nodeId) ?? (() => {
    const asset = detailAssetForNode(nodeId)
    return asset ? cache.has(asset.id) : false
  })())

  const dispose = async () => {
    clearPartHelpers()
    const loadedEntries = await Promise.all([...cache.values()].map(entry => entry.promise.catch(() => null)))
    for (const loaded of loadedEntries) {
      if (!loaded?.root) continue
      loaded.root.removeFromParent()
      disposeObject(loaded.root)
    }
    cache.clear()
    resolvedByNode.clear()
    activeNodeId = null
  }

  return {
    hasDetail,
    isLoaded,
    loadForNode,
    hideAll,
    setSectionEnabled,
    setExplode,
    setPartVisible,
    setSelectedPart,
    setHoveredPart,
    setGhostOtherParts,
    setOnlyPartVisible,
    getPartObject,
    getPartStats,
    pickPart,
    resetNode,
    resetAll,
    getActiveNodeId: () => activeNodeId,
    dispose,
  }
}
