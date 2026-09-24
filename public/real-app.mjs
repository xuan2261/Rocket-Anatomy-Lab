import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  initialState,
  selectPart,
  setExplode,
  setMode,
  toggleHidden,
  toggleIsolate,
  showAll,
  resetViewer,
} from './core/engine.js'
import { deriveSemanticView, curatedNodeMap, validateCuratedCoverage } from './core/semantic.js'
import { validateAssemblyManifest } from './core/assembly.js'
import { nasaSaturnVAssemblyManifest, nasaSaturnVAssemblySemanticManifest } from './core/assemblyManifest.js'
import { nasaSaturnVCuratedManifest as presentationManifest } from './core/curatedManifest.js'
import { cameraTransitionDurationMs, standardTransitionDurationMs, timelineAssemblyAmounts } from './core/timeline.js'
import { createTimelineController } from './timeline-controller.mjs'
import { sectionPlaneDescriptor } from './core/section.js'
import { createSectionController } from './section-controller.mjs'
import { createLearningController } from './learning-controller.mjs'
import { entityDescription, entityLabel, onLanguageChange, t } from './i18n.mjs'

const EDUCATION_ASSET = './assets/saturn-v-education.glb'
const LOCAL_ASSET = './assets/saturn-v.glb'
const NASA_ASSET = 'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/saturn-v/Saturn%20V.glb'

const canvas = document.querySelector('#viewport')
const tree = document.querySelector('#tree')
const inspectorTitle = document.querySelector('#inspectorTitle')
const inspectorDescription = document.querySelector('#inspectorDescription')
const visibilityValue = document.querySelector('#visibilityValue')
const modeValue = document.querySelector('#modeValue')
const explodeValue = document.querySelector('#explodeValue')
const isolateBtn = document.querySelector('#isolateBtn')
const hideBtn = document.querySelector('#hideBtn')
const showAllBtn = document.querySelector('#showAllBtn')
const explodeSlider = document.querySelector('#explodeSlider')
const resetBtn = document.querySelector('#resetBtn')
const modeChip = document.querySelector('#modeChip')
const modeButtons = [...document.querySelectorAll('[data-mode]')]
const assetStatus = document.querySelector('#assetStatus')
const sourceNote = document.querySelector('.source-note')
const rawInventory = document.querySelector('#rawInventory')

let state = initialState()
let manifest = presentationManifest
let rendererKind = 'presentation'
let model = null
let modelAxis = new THREE.Vector3(0, 1, 0)
let modelSpread = 1
let groupedNodes = new Map()
let partRoots = []
let timelineController = null
let timelineMode = false
let timelineAmounts = new Map()
let assemblyTransition = null
let cameraTransition = null
let overviewCamera = null
let sectionController = null
let learningController = null
let sectionState = null
let sectionModelBox = null
let sectionCapMesh = null
let sectionStencilMeshes = []
let sectionStencilMaterials = []
let sectionSourceMeshes = []
let activeSourceKey = null
let activeAxisKey = 'Y'
const sectionPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0b111a)

const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 10000)
camera.position.set(5, 4, 7)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, stencil: true })
renderer.localClippingEnabled = true
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
const sectionCappingSupported = renderer.getContext().getContextAttributes()?.stencil === true

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.screenSpacePanning = true
controls.addEventListener('start', () => { cameraTransition = null })

scene.add(new THREE.HemisphereLight(0xbfd7ff, 0x17202d, 2.2))
const key = new THREE.DirectionalLight(0xffffff, 3.0)
key.position.set(4, 7, 5)
scene.add(key)
const fill = new THREE.DirectionalLight(0x7bbcff, 1.25)
fill.position.set(-5, 1, -4)
scene.add(fill)

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let pointerDown = null

function resize() {
  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

const resizeObserver = new ResizeObserver(resize)
resizeObserver.observe(canvas)
resize()

function cloneMaterials(root) {
  root.traverse(object => {
    if (!object.isMesh) return
    if (Array.isArray(object.material)) object.material = object.material.map(mat => mat.clone())
    else if (object.material) object.material = object.material.clone()
  })
}

function collectPartRoots(root) {
  if (root.children.length > 1) return [...root.children]
  const only = root.children[0]
  return only && only.children.length > 1 ? [...only.children] : [root]
}

function longestAxis(box) {
  const size = box.getSize(new THREE.Vector3())
  if (size.x >= size.y && size.x >= size.z) return { axis: new THREE.Vector3(1, 0, 0), key: 'x', extent: size.x }
  if (size.y >= size.x && size.y >= size.z) return { axis: new THREE.Vector3(0, 1, 0), key: 'y', extent: size.y }
  return { axis: new THREE.Vector3(0, 0, 1), key: 'z', extent: size.z }
}

function applyCuratedMapping(root) {
  root.updateMatrixWorld(true)
  const modelBox = new THREE.Box3().setFromObject(root)
  const { axis, key, extent } = longestAxis(modelBox)
  if (key !== presentationManifest.assetFingerprint.primaryAxis) {
    throw new Error(`Curated NASA map expects ${presentationManifest.assetFingerprint.primaryAxis.toUpperCase()} as the primary axis, received ${key.toUpperCase()}`)
  }
  modelAxis.copy(axis)
  modelSpread = Math.max(extent * 0.12, 0.1)

  groupedNodes = new Map(presentationManifest.groups.map(group => [group.id, []]))
  partRoots = collectPartRoots(root)
  const actualNames = partRoots.map(partRoot => partRoot.name)
  const coverageErrors = validateCuratedCoverage(presentationManifest, actualNames)
  if (coverageErrors.length) {
    throw new Error(`Curated NASA node map does not match imported asset: ${coverageErrors.join('; ')}`)
  }

  const nameToGroup = curatedNodeMap(presentationManifest)
  for (const partRoot of partRoots) {
    const groupId = nameToGroup.get(partRoot.name)
    if (!groupId) throw new Error(`No curated group for NASA node: ${partRoot.name}`)
    partRoot.userData.rocketBasePosition = partRoot.position.clone()
    partRoot.userData.rocketGroupId = groupId
    partRoot.traverse(object => {
      object.userData.rocketGroupId = groupId
      if (object.isMesh) {
        object.userData.rocketOriginalMaterialState = captureMaterialState(object.material)
      }
    })
    groupedNodes.get(groupId).push(partRoot)
  }

  return { modelBox, axisKey: key }
}


function applyAssemblyMapping(root, parserJson) {
  const manifestErrors = validateAssemblyManifest(nasaSaturnVAssemblyManifest)
  if (manifestErrors.length) throw new Error(`Assembly manifest invalid: ${manifestErrors.join('; ')}`)
  const meta = parserJson?.asset?.extras?.rocketAnatomyLabAssembly
  if (!meta) throw new Error('Assembly GLB metadata missing')
  if (meta.manifestId !== nasaSaturnVAssemblyManifest.id) throw new Error(`Assembly manifest mismatch: ${meta.manifestId ?? 'missing'}`)
  if (meta.sourceGitSha !== nasaSaturnVAssemblyManifest.source.gitSha) throw new Error('Assembly GLB source fingerprint mismatch')
  if (meta.educationalOnly !== true || meta.historicalStageBoundaries !== false) {
    throw new Error('Assembly GLB safety/meaning metadata is invalid')
  }

  root.updateMatrixWorld(true)
  const modelBox = new THREE.Box3().setFromObject(root)
  const { axis, key, extent } = longestAxis(modelBox)
  if (key !== nasaSaturnVAssemblyManifest.source.primaryAxis) {
    throw new Error(`Assembly GLB expects ${nasaSaturnVAssemblyManifest.source.primaryAxis.toUpperCase()} as the primary axis, received ${key.toUpperCase()}`)
  }
  modelAxis.copy(axis)
  modelSpread = Math.max(extent * 0.09, 0.1)
  manifest = nasaSaturnVAssemblySemanticManifest
  rendererKind = 'assembly'
  groupedNodes = new Map(manifest.groups.map(group => [group.id, []]))
  partRoots = []
  root.traverse(object => {
    const groupId = object.userData?.rocketAssemblyId
    if (!groupId || !groupedNodes.has(groupId)) return
    // Only the authored assembly node itself owns the transform. Descendants inherit it.
    if (object.parent?.userData?.rocketAssemblyId === groupId) return
    partRoots.push(object)
    groupedNodes.get(groupId).push(object)
  })
  const actualIds = new Set(partRoots.map(rootNode => rootNode.userData.rocketAssemblyId))
  const expectedIds = new Set(manifest.groups.map(group => group.id))
  for (const id of expectedIds) if (!actualIds.has(id)) throw new Error(`Assembly GLB missing transformable subtree: ${id}`)
  for (const id of actualIds) if (!expectedIds.has(id)) throw new Error(`Assembly GLB has unexpected subtree: ${id}`)
  for (const group of manifest.groups) {
    const roots = groupedNodes.get(group.id) ?? []
    if (roots.length !== 1) throw new Error(`${group.id}: expected exactly one transformable subtree, found ${roots.length}`)
  }
  for (const partRoot of partRoots) {
    const groupId = partRoot.userData.rocketAssemblyId
    partRoot.userData.rocketBasePosition = partRoot.position.clone()
    partRoot.userData.rocketGroupId = groupId
    partRoot.traverse(object => {
      object.userData.rocketGroupId = groupId
      if (object.isMesh) object.userData.rocketOriginalMaterialState = captureMaterialState(object.material)
    })
  }
  return { modelBox, axisKey: key }
}

function captureMaterialState(material) {
  const list = Array.isArray(material) ? material : [material]
  return list.map(mat => ({
    opacity: mat?.opacity ?? 1,
    transparent: mat?.transparent ?? false,
    depthWrite: mat?.depthWrite ?? true,
    wireframe: 'wireframe' in (mat ?? {}) ? Boolean(mat.wireframe) : false,
    emissive: mat?.emissive?.clone?.() ?? null,
    emissiveIntensity: typeof mat?.emissiveIntensity === 'number' ? mat.emissiveIntensity : null,
    clippingPlanes: Array.isArray(mat?.clippingPlanes) ? [...mat.clippingPlanes] : null,
    clipShadows: mat?.clipShadows ?? false,
  }))
}

function applyMaterialState(mesh, view) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  const originals = mesh.userData.rocketOriginalMaterialState ?? []
  materials.forEach((material, index) => {
    if (!material) return
    const original = originals[index] ?? {}
    material.transparent = view.opacity < 1 || original.transparent === true
    material.opacity = view.opacity < 1 ? view.opacity : (original.opacity ?? 1)
    material.depthWrite = view.opacity >= 0.99 ? (original.depthWrite ?? true) : false
    if ('wireframe' in material) material.wireframe = view.wireframe ? true : (original.wireframe ?? false)
    if (material.emissive) {
      if (view.selected) {
        material.emissive.setHex(0x315f82)
        if (typeof material.emissiveIntensity === 'number') material.emissiveIntensity = 0.75
      } else if (original.emissive) {
        material.emissive.copy(original.emissive)
        if (typeof material.emissiveIntensity === 'number' && original.emissiveIntensity !== null) {
          material.emissiveIntensity = original.emissiveIntensity
        }
      } else {
        material.emissive.setHex(0x000000)
      }
    }
    material.needsUpdate = true
  })
}

function sourceMeshList() {
  const meshes = []
  model?.traverse(object => {
    if (!object.isMesh) return
    if (object.userData?.rocketSectionStencil || object.userData?.rocketSectionCap) return
    meshes.push(object)
  })
  return meshes
}

function restoreSectionMaterialClipping(mesh) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  const originals = mesh.userData.rocketOriginalMaterialState ?? []
  materials.forEach((material, index) => {
    if (!material) return
    const original = originals[index] ?? {}
    material.clippingPlanes = original.clippingPlanes ?? null
    material.clipShadows = original.clipShadows ?? false
    material.needsUpdate = true
  })
}

function applySectionMaterialClipping(enabled) {
  for (const mesh of sectionSourceMeshes) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const originals = mesh.userData.rocketOriginalMaterialState ?? []
    materials.forEach((material, index) => {
      if (!material) return
      if (enabled) {
        material.clippingPlanes = [sectionPlane]
        material.clipShadows = true
      } else {
        const original = originals[index] ?? {}
        material.clippingPlanes = original.clippingPlanes ?? null
        material.clipShadows = original.clipShadows ?? false
      }
      material.needsUpdate = true
    })
  }
}

function createSectionStencilMaterial(side, increment) {
  const material = new THREE.MeshBasicMaterial()
  material.depthWrite = false
  material.depthTest = false
  material.colorWrite = false
  material.stencilWrite = true
  material.stencilFunc = THREE.AlwaysStencilFunc
  material.side = side
  material.clippingPlanes = [sectionPlane]
  const op = increment ? THREE.IncrementWrapStencilOp : THREE.DecrementWrapStencilOp
  material.stencilFail = op
  material.stencilZFail = op
  material.stencilZPass = op
  return material
}

function disposeSectionCutaway() {
  applySectionMaterialClipping(false)
  for (const mesh of sectionSourceMeshes) {
    if (typeof mesh.userData.rocketSectionOriginalRenderOrder === 'number') {
      mesh.renderOrder = mesh.userData.rocketSectionOriginalRenderOrder
      delete mesh.userData.rocketSectionOriginalRenderOrder
    }
  }
  for (const stencil of sectionStencilMeshes) stencil.parent?.remove(stencil)
  for (const material of sectionStencilMaterials) material.dispose?.()
  sectionStencilMeshes = []
  sectionStencilMaterials = []
  sectionSourceMeshes = []
  if (sectionCapMesh) {
    scene.remove(sectionCapMesh)
    sectionCapMesh.geometry?.dispose?.()
    sectionCapMesh.material?.dispose?.()
    sectionCapMesh = null
  }
}

function createSectionCutaway() {
  disposeSectionCutaway()
  if (!model || !sectionModelBox) return
  sectionSourceMeshes = sourceMeshList()
  const backMaterial = createSectionStencilMaterial(THREE.BackSide, true)
  const frontMaterial = createSectionStencilMaterial(THREE.FrontSide, false)
  sectionStencilMaterials = [backMaterial, frontMaterial]

  for (const mesh of sectionSourceMeshes) {
    mesh.userData.rocketSectionOriginalRenderOrder = mesh.renderOrder
    mesh.renderOrder = 6
    for (const [material, suffix] of [[backMaterial, 'back'], [frontMaterial, 'front']]) {
      const stencil = new THREE.Mesh(mesh.geometry, material)
      stencil.name = `${mesh.name || 'mesh'}__section_${suffix}`
      stencil.userData.rocketSectionStencil = true
      stencil.renderOrder = 1
      stencil.visible = false
      stencil.raycast = () => {}
      mesh.add(stencil)
      sectionStencilMeshes.push(stencil)
    }
  }

  const size = sectionModelBox.getSize(new THREE.Vector3())
  const capExtent = Math.max(size.x, size.y, size.z) * 2.5
  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0x315f82,
    metalness: 0.05,
    roughness: 0.72,
    side: THREE.DoubleSide,
    stencilWrite: true,
    stencilRef: 0,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.ReplaceStencilOp,
    stencilZFail: THREE.ReplaceStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  })
  sectionCapMesh = new THREE.Mesh(new THREE.PlaneGeometry(capExtent, capExtent), capMaterial)
  sectionCapMesh.name = 'rocket-section-cap'
  sectionCapMesh.userData.rocketSectionCap = true
  sectionCapMesh.renderOrder = 2
  sectionCapMesh.visible = false
  sectionCapMesh.raycast = () => {}
  sectionCapMesh.onAfterRender = activeRenderer => activeRenderer.clearStencil()
  scene.add(sectionCapMesh)
}

function updateSectionCutaway(nextState) {
  sectionState = nextState
  if (!model || !sectionModelBox) return
  const descriptor = sectionPlaneDescriptor(nextState, { min: sectionModelBox.min, max: sectionModelBox.max })
  sectionPlane.normal.set(...descriptor.normal)
  sectionPlane.constant = descriptor.constant
  const enabled = nextState.enabled
  applySectionMaterialClipping(enabled)
  const capped = enabled && nextState.capped && sectionCappingSupported
  for (const stencil of sectionStencilMeshes) stencil.visible = capped
  if (sectionCapMesh) {
    sectionCapMesh.visible = capped
    sectionPlane.coplanarPoint(sectionCapMesh.position)
    const target = sectionCapMesh.position.clone().sub(sectionPlane.normal)
    sectionCapMesh.lookAt(target)
  }
}

function handleSectionChange(_previous, next) {
  updateSectionCutaway(next)
}

function parentLocalAxis(object, worldAxis) {
  const parent = object.parent
  if (!parent) return worldAxis.clone()
  const parentWorldQuat = parent.getWorldQuaternion(new THREE.Quaternion())
  return worldAxis.clone().applyQuaternion(parentWorldQuat.invert()).normalize()
}

function applyStateToModel(amountOverride = null) {
  if (!model) return
  const views = deriveSemanticView(manifest, state)
  for (const view of views) {
    const roots = groupedNodes.get(view.id) ?? []
    const group = manifest.groups.find(item => item.id === view.id)
    const explodeFactor = amountOverride && group
      ? group.explodeSignedFactor * (amountOverride.get(view.id) ?? 0)
      : view.explodeSignedFactor
    for (const root of roots) {
      root.visible = view.visible
      const base = root.userData.rocketBasePosition
      if (base) {
        const localAxis = parentLocalAxis(root, modelAxis)
        root.position.copy(base).addScaledVector(localAxis, modelSpread * explodeFactor)
      }
      root.traverse(object => {
        if (object.isMesh && !object.userData?.rocketSectionStencil) applyMaterialState(object, view)
      })
    }
  }
  model.updateMatrixWorld(true)
}

const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

function copyAmountMap(source) {
  return new Map(manifest.groups.map(group => [group.id, source.get(group.id) ?? 0]))
}

function manualAmountMap() {
  return new Map(manifest.groups.map(group => [group.id, state.explode]))
}

function activeAmountMap() {
  return timelineMode ? timelineAmounts : null
}

function cancelPresentationMotion() {
  assemblyTransition = null
  cameraTransition = null
}

function finishAssemblyTransition() {
  if (!assemblyTransition) return
  timelineAmounts = copyAmountMap(assemblyTransition.to)
  assemblyTransition = null
  applyStateToModel(timelineAmounts)
}

function startAssemblyTransition(target, durationMs) {
  const from = timelineMode ? copyAmountMap(timelineAmounts) : manualAmountMap()
  const to = copyAmountMap(target)
  timelineMode = true
  if (durationMs <= 0) {
    timelineAmounts = to
    assemblyTransition = null
    applyStateToModel(timelineAmounts)
    return
  }
  timelineAmounts = from
  assemblyTransition = { from, to, start: performance.now(), durationMs }
  applyStateToModel(timelineAmounts)
}

function updateAssemblyTransition(now) {
  if (!assemblyTransition) return
  const raw = Math.min(1, Math.max(0, (now - assemblyTransition.start) / assemblyTransition.durationMs))
  const eased = easeInOutCubic(raw)
  const next = new Map()
  for (const group of manifest.groups) {
    const from = assemblyTransition.from.get(group.id) ?? 0
    const to = assemblyTransition.to.get(group.id) ?? 0
    next.set(group.id, from + (to - from) * eased)
  }
  timelineAmounts = next
  applyStateToModel(timelineAmounts)
  if (raw >= 1) finishAssemblyTransition()
}

function setCameraPose(position, target) {
  camera.position.copy(position)
  controls.target.copy(target)
  const distance = Math.max(camera.position.distanceTo(controls.target), 0.01)
  camera.near = Math.max(distance / 1000, 0.001)
  camera.far = Math.max(distance * 20, 100)
  camera.updateProjectionMatrix()
  controls.update()
}

function startCameraTransition(position, target, durationMs) {
  const toPosition = position.clone()
  const toTarget = target.clone()
  if (durationMs <= 0) {
    cameraTransition = null
    setCameraPose(toPosition, toTarget)
    return
  }
  cameraTransition = {
    fromPosition: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPosition,
    toTarget,
    start: performance.now(),
    durationMs,
  }
}

function updateCameraTransition(now) {
  if (!cameraTransition) return
  const raw = Math.min(1, Math.max(0, (now - cameraTransition.start) / cameraTransition.durationMs))
  const eased = easeInOutCubic(raw)
  const position = cameraTransition.fromPosition.clone().lerp(cameraTransition.toPosition, eased)
  const target = cameraTransition.fromTarget.clone().lerp(cameraTransition.toTarget, eased)
  setCameraPose(position, target)
  if (raw >= 1) cameraTransition = null
}

function focusCameraOnGroup(groupId, durationMs) {
  const roots = groupedNodes.get(groupId) ?? []
  if (!roots.length) return
  const box = new THREE.Box3()
  for (const root of roots) box.expandByObject(root)
  if (box.isEmpty()) return
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  const radius = Math.max(sphere.radius, 0.01)
  const fov = THREE.MathUtils.degToRad(camera.fov)
  const distance = radius / Math.sin(fov / 2) * 1.45
  const direction = camera.position.clone().sub(controls.target)
  if (direction.lengthSq() < 1e-8) direction.set(1, 0.65, 1.25)
  direction.normalize()
  startCameraTransition(sphere.center.clone().add(direction.multiplyScalar(distance)), sphere.center, durationMs)
}

function restoreOverviewCamera(durationMs) {
  if (!overviewCamera) return
  startCameraTransition(overviewCamera.position, overviewCamera.target, durationMs)
}

function annotationAnchorForGroup(groupId) {
  if (!model || state.hiddenIds.has(groupId)) return null
  if (state.isolatedId && state.isolatedId !== groupId) return null
  const roots = groupedNodes.get(groupId) ?? []
  if (!roots.length) return null
  const box = new THREE.Box3()
  for (const root of roots) box.expandByObject(root)
  if (box.isEmpty()) return null
  const center = box.getCenter(new THREE.Vector3())
  center.project(camera)
  if (center.z < -1 || center.z > 1) return null
  const rect = canvas.getBoundingClientRect()
  return {
    x: (center.x * 0.5 + 0.5) * rect.width,
    y: (-center.y * 0.5 + 0.5) * rect.height,
    visible: true,
  }
}

function handleTimelineTransition(previous, next, meta) {
  if (rendererKind !== 'assembly' || meta.reason === 'direction') return
  state = setExplode(state, 0)
  explodeSlider.value = '0'
  if (next.focusedAssemblyId) state = selectPart(state, next.focusedAssemblyId)
  if (meta.reason === 'restart') state = selectPart(state, null)
  const target = timelineAssemblyAmounts(next)
  startAssemblyTransition(target, standardTransitionDurationMs(next))
  if (next.focusedAssemblyId) focusCameraOnGroup(next.focusedAssemblyId, cameraTransitionDurationMs(next))
  else if (meta.reason === 'restart' || next.stepIndex === 0) restoreOverviewCamera(cameraTransitionDurationMs(next))
  renderTree()
  renderInspector()
}

function handleReducedMotionChange(_previous, next) {
  if (!next.reducedMotion) return
  finishAssemblyTransition()
  if (cameraTransition) {
    const finalPose = cameraTransition
    cameraTransition = null
    setCameraPose(finalPose.toPosition, finalPose.toTarget)
  }
}

function fitCamera(box) {
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  const radius = Math.max(sphere.radius, 0.01)
  const fov = THREE.MathUtils.degToRad(camera.fov)
  const distance = radius / Math.sin(fov / 2) * 1.2
  camera.position.copy(sphere.center).add(new THREE.Vector3(1, 0.65, 1.25).normalize().multiplyScalar(distance))
  camera.near = Math.max(distance / 1000, 0.001)
  camera.far = Math.max(distance * 20, 100)
  camera.updateProjectionMatrix()
  controls.target.copy(sphere.center)
  controls.update()
}

async function loadModel() {
  const loader = new GLTFLoader()
  let gltf = null
  let source = ''
  let mapping = null
  try {
    gltf = await loader.loadAsync(EDUCATION_ASSET)
    model = gltf.scene
    cloneMaterials(model)
    scene.add(model)
    mapping = applyAssemblyMapping(model, gltf.parser?.json)
    source = 'source.educationLocal'
  } catch (assemblyError) {
    if (model) {
      scene.remove(model)
      model = null
    }
    console.info('[Rocket Anatomy Lab] Assembly-capable GLB unavailable; using verified presentation asset.', assemblyError)
    manifest = presentationManifest
    rendererKind = 'presentation'
    try {
      gltf = await loader.loadAsync(LOCAL_ASSET)
      source = 'source.presentationLocal'
    } catch {
      gltf = await loader.loadAsync(NASA_ASSET)
      source = 'source.presentationRemote'
    }
    model = gltf.scene
    cloneMaterials(model)
    scene.add(model)
    mapping = applyCuratedMapping(model)
  }

  sectionModelBox = mapping.modelBox.clone()
  fitCamera(mapping.modelBox)
  overviewCamera = { position: camera.position.clone(), target: controls.target.clone() }
  timelineAmounts = new Map(manifest.groups.map(group => [group.id, 0]))
  applyStateToModel()
  activeSourceKey = source
  activeAxisKey = mapping.axisKey.toUpperCase()
  renderAssetCopy()
  renderRawInventory()
}

function renderAssetCopy() {
  if (!activeSourceKey) return
  const source = t(activeSourceKey)
  if (rendererKind === 'assembly') {
    assetStatus.textContent = t('app.assetAssembly', { count: manifest.groups.length, axis: activeAxisKey })
    assetStatus.dataset.state = 'assembly'
    sourceNote.textContent = t('app.sourceAssembly', { source })
  } else {
    assetStatus.textContent = t('app.assetPresentation', { count: partRoots.length, axis: activeAxisKey })
    assetStatus.dataset.state = 'real'
    sourceNote.textContent = t('app.sourcePresentation', { source, sha: presentationManifest.assetFingerprint.gitSha.slice(0, 12) })
  }
}

function renderRawInventory() {
  rawInventory.replaceChildren()
  const presentationMap = rendererKind === 'presentation' ? curatedNodeMap(presentationManifest) : null
  for (const partRoot of [...partRoots].sort((a, b) => a.name.localeCompare(b.name))) {
    const row = document.createElement('div')
    row.className = 'raw-node-row'
    const rawName = document.createElement('code')
    rawName.textContent = partRoot.name || t('raw.unnamed')
    const groupId = rendererKind === 'assembly'
      ? partRoot.userData.rocketAssemblyId
      : presentationMap?.get(partRoot.name)
    const group = manifest.groups.find(item => item.id === groupId)
    const mapping = document.createElement('span')
    mapping.textContent = group ? entityLabel(group.id, group.label) : t('raw.unmapped')
    row.append(rawName, mapping)
    rawInventory.append(row)
  }
}

function renderTree() {
  tree.replaceChildren()
  for (const group of manifest.groups) {
    const row = document.createElement('div')
    row.className = 'tree-row'
    row.dataset.selected = String(state.selectedId === group.id)
    row.setAttribute('role', 'treeitem')
    row.setAttribute('aria-selected', String(state.selectedId === group.id))

    const toggleTarget = document.createElement('label')
    toggleTarget.className = 'tree-toggle-target'
    const check = document.createElement('input')
    check.type = 'checkbox'
    check.checked = !state.hiddenIds.has(group.id)
    check.setAttribute('aria-label', t('tree.showPart', { label: entityLabel(group.id, group.label) }))
    check.addEventListener('change', () => {
      state = toggleHidden(state, group.id)
      renderUiAndModel()
    })
    toggleTarget.append(check)

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'tree-select'
    const label = document.createElement('strong')
    label.textContent = entityLabel(group.id, group.label)
    const meta = document.createElement('span')
    meta.textContent = rendererKind === 'assembly' ? t('tree.oneTransformable') : t('tree.importedObjects', { count: groupedNodes.get(group.id)?.length ?? 0 })
    button.append(label, meta)
    button.addEventListener('click', () => {
      state = selectPart(state, group.id)
      renderUiAndModel()
    })
    row.append(toggleTarget, button)
    tree.append(row)
  }
}

const modeLabel = mode => ({ normal: t('viewer.mode.normal'), ghost: t('viewer.mode.ghost'), xray: t('viewer.mode.xray') }[mode] ?? mode)

function renderInspector() {
  const group = manifest.groups.find(item => item.id === state.selectedId) ?? null
  const view = group ? deriveSemanticView(manifest, state).find(item => item.id === group.id) : null
  inspectorTitle.textContent = group ? entityLabel(group.id, group.label) : t('inspector.noneTitle')
  inspectorDescription.textContent = group ? entityDescription(group.id, group.description) : t('inspector.noneDescription')
  visibilityValue.textContent = view ? t(view.visible ? 'inspector.visible' : 'inspector.hidden') : '—'
  modeValue.textContent = modeLabel(state.mode)
  const timelineState = timelineController?.getState?.()
  explodeValue.textContent = timelineMode && timelineState
    ? t('inspector.guided', { percent: Math.round(timelineState.progress * 100) })
    : `${Math.round(state.explode * 100)}%`
  isolateBtn.disabled = !group
  hideBtn.disabled = !group
  isolateBtn.textContent = t(group && state.isolatedId === group.id ? 'inspector.exitIsolate' : 'inspector.isolate')
  hideBtn.textContent = t(group && state.hiddenIds.has(group.id) ? 'inspector.show' : 'inspector.hide')
  modeChip.textContent = modeValue.textContent
  modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)))
}

function renderUiAndModel() {
  renderTree()
  renderInspector()
  applyStateToModel(activeAmountMap())
}

modeButtons.forEach(button => button.addEventListener('click', () => {
  state = setMode(state, button.dataset.mode)
  renderUiAndModel()
}))

explodeSlider.addEventListener('input', () => {
  cancelPresentationMotion()
  timelineController?.resetSilently?.()
  timelineMode = false
  state = setExplode(state, Number(explodeSlider.value) / 100)
  renderUiAndModel()
})

isolateBtn.addEventListener('click', () => {
  if (!state.selectedId) return
  state = toggleIsolate(state, state.selectedId)
  renderUiAndModel()
})

hideBtn.addEventListener('click', () => {
  if (!state.selectedId) return
  state = toggleHidden(state, state.selectedId)
  renderUiAndModel()
})

showAllBtn.addEventListener('click', () => {
  state = showAll(state)
  renderUiAndModel()
})

resetBtn.addEventListener('click', () => {
  cancelPresentationMotion()
  timelineController?.resetSilently?.()
  sectionController?.resetSilently?.()
  timelineMode = false
  state = resetViewer()
  explodeSlider.value = '0'
  renderUiAndModel()
  if (overviewCamera) setCameraPose(overviewCamera.position, overviewCamera.target)
})

canvas.addEventListener('pointerdown', event => {
  pointerDown = { x: event.clientX, y: event.clientY }
})

canvas.addEventListener('pointerup', event => {
  if (!pointerDown || !model) return
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y)
  pointerDown = null
  if (moved >= 5) return
  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hit = raycaster.intersectObject(model, true).find(item => item.object.visible)
  const id = hit?.object?.userData?.rocketGroupId ?? null
  if (id) {
    state = selectPart(state, id)
    renderUiAndModel()
  }
})

canvas.addEventListener('pointercancel', () => { pointerDown = null })
canvas.addEventListener('keydown', event => {
  if (event.key === '1') state = setMode(state, 'normal')
  else if (event.key === '2') state = setMode(state, 'ghost')
  else if (event.key === '3') state = setMode(state, 'xray')
  else if (event.key === 'Escape') state = { ...state, isolatedId: null }
  else return
  renderUiAndModel()
})

let frameId = 0
function animate(now = performance.now()) {
  updateAssemblyTransition(now)
  updateCameraTransition(now)
  controls.update()
  renderer.render(scene, camera)
  learningController?.updateAnnotations?.()
  frameId = requestAnimationFrame(animate)
}
animate()

const unsubscribeLanguage = onLanguageChange(() => {
  renderAssetCopy()
  renderRawInventory()
  renderUiAndModel()
})

window.addEventListener('pagehide', () => {
  cancelAnimationFrame(frameId)
  timelineController?.destroy?.()
  learningController?.destroy?.()
  unsubscribeLanguage()
  sectionController?.destroy?.()
  resizeObserver.disconnect()
  controls.dispose()
  disposeSectionCutaway()
  if (model) {
    const geometries = new Set()
    const materials = new Set()
    const textures = new Set()
    model.traverse(object => {
      if (!object.isMesh) return
      if (object.geometry) geometries.add(object.geometry)
      const ownedMaterials = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of ownedMaterials) {
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
  renderer.dispose()
}, { once: true })

await loadModel()
createSectionCutaway()
sectionController = createSectionController({
  disabled: false,
  cappingSupported: sectionCappingSupported,
  onChange: handleSectionChange,
})
sectionState = sectionController.getState()
updateSectionCutaway(sectionState)
const timelineLabels = new Map(nasaSaturnVAssemblySemanticManifest.groups.map(group => [group.id, group.label]))
timelineController = createTimelineController({
  assemblyIds: nasaSaturnVAssemblyManifest.segments.map(segment => segment.id),
  assemblyLabels: timelineLabels,
  disabled: rendererKind !== 'assembly',
  onTransition: handleTimelineTransition,
  onReducedMotionChange: handleReducedMotionChange,
})
learningController = createLearningController({
  disabled: rendererKind !== 'assembly',
  onSelectAssembly: assemblyId => {
    state = selectPart(state, assemblyId)
    renderUiAndModel()
  },
  onFocusAssembly: assemblyId => {
    const reducedMotion = timelineController?.getState?.().reducedMotion === true
    focusCameraOnGroup(assemblyId, reducedMotion ? 0 : 480)
  },
  onApplyView: lesson => {
    state = setMode(state, lesson.viewMode ?? 'normal')
    sectionController?.applyPreset?.(lesson.sectionPreset)
    renderUiAndModel()
  },
  getAnnotationAnchor: annotationAnchorForGroup,
})
renderUiAndModel()
learningController.updateAnnotations()
