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

export function createRealDetailLoader({ scene, modelBox, sectionPlane }) {
  if (!scene || !modelBox || modelBox.isEmpty()) throw new Error('Real detail loader requires a scene and non-empty model box')

  const loader = new GLTFLoader()
  const cache = new Map()
  let sectionEnabled = false
  let activeNodeId = null

  const modelSize = modelBox.getSize(new THREE.Vector3())
  const modelCenter = modelBox.getCenter(new THREE.Vector3())
  const modelExtent = Math.max(modelSize.x, modelSize.y, modelSize.z)

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

  const preparePartMetadata = (root, asset) => {
    if (asset.sourceKind !== 'generated-stl-package') return { parts: new Map(), packageExtent: 0 }

    root.updateMatrixWorld(true)
    const packageBox = new THREE.Box3().setFromObject(root)
    const packageCenter = packageBox.getCenter(new THREE.Vector3())
    const packageSize = packageBox.getSize(new THREE.Vector3())
    const packageExtent = Math.max(packageSize.x, packageSize.y, packageSize.z)
    const parts = new Map()
    let fallbackIndex = 0

    root.traverse(object => {
      const sourcePart = object.userData?.sourcePart
      if (!sourcePart || !object.isMesh || parts.has(sourcePart)) return

      const partBox = new THREE.Box3().setFromObject(object)
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

      parts.set(sourcePart, {
        object,
        basePosition: object.position.clone(),
        direction,
      })
    })

    return { parts, packageExtent }
  }

  const fitToAnchor = (root, asset) => {
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
        const explodeMeta = preparePartMetadata(root, asset)
        fitToAnchor(root, asset)
        applyClipping(root)
        root.visible = false
        scene.add(root)
        return { asset, root, gltf, explodeMeta, explode: 0 }
      }).catch(error => {
        cache.delete(asset.id)
        throw error
      })
      entry = { promise }
      cache.set(asset.id, entry)
    }

    const loaded = await entry.promise
    for (const cached of cache.values()) {
      const other = await cached.promise.catch(() => null)
      if (other?.root) other.root.visible = other.asset.id === loaded.asset.id
    }
    activeNodeId = nodeId
    loaded.root.visible = true
    return loaded
  }

  const loadedForNode = async nodeId => {
    const asset = detailAssetForNode(nodeId)
    if (!asset) return null
    const entry = cache.get(asset.id)
    return entry ? entry.promise.catch(() => null) : null
  }

  const hideAll = async () => {
    activeNodeId = null
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

    const distance = loaded.explodeMeta.packageExtent * 0.16 * amount
    for (const meta of loaded.explodeMeta.parts.values()) {
      meta.object.position.copy(meta.basePosition)
      meta.object.position.addScaledVector(meta.direction, distance)
    }
    loaded.root.updateMatrixWorld(true)
    return true
  }

  const setPartVisible = async (nodeId, partId, visible) => {
    const loaded = await loadedForNode(nodeId)
    const meta = loaded?.explodeMeta.parts.get(partId)
    if (!meta) return false
    meta.object.visible = Boolean(visible)
    return true
  }

  const resetNode = async nodeId => {
    const loaded = await loadedForNode(nodeId)
    if (!loaded) return false
    await setExplode(nodeId, 0)
    for (const meta of loaded.explodeMeta.parts.values()) meta.object.visible = true
    return true
  }

  const resetAll = async () => {
    for (const asset of cache.keys()) {
      const entry = cache.get(asset)
      const loaded = await entry?.promise.catch(() => null)
      if (!loaded) continue
      await resetNode(loaded.asset.anatomyNodeId)
      loaded.root.visible = false
    }
    activeNodeId = null
  }

  const hasDetail = nodeId => Boolean(detailAssetForNode(nodeId))
  const isLoaded = nodeId => {
    const asset = detailAssetForNode(nodeId)
    return asset ? cache.has(asset.id) : false
  }

  const dispose = async () => {
    const loadedEntries = await Promise.all([...cache.values()].map(entry => entry.promise.catch(() => null)))
    for (const loaded of loadedEntries) {
      if (!loaded?.root) continue
      loaded.root.removeFromParent()
      disposeObject(loaded.root)
    }
    cache.clear()
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
    resetNode,
    resetAll,
    getActiveNodeId: () => activeNodeId,
    dispose,
  }
}
