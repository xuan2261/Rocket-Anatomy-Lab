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
    root.traverse(object => {
      object.userData.isQualifiedRealDetail = true
      object.userData.detailAssetId = asset.id
      object.userData.anatomyNodeId = asset.anatomyNodeId
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
        fitToAnchor(root, asset)
        applyClipping(root)
        root.visible = false
        scene.add(root)
        return { asset, root, gltf }
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
    getActiveNodeId: () => activeNodeId,
    dispose,
  }
}
