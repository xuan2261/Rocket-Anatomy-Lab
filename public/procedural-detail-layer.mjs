import * as THREE from 'three'

const disposeMaterial = material => {
  if (Array.isArray(material)) material.forEach(disposeMaterial)
  else material?.dispose?.()
}

export function createProceduralDetailLayer({ modelBox, sectionPlane }) {
  if (!modelBox || modelBox.isEmpty()) throw new Error('Procedural detail layer requires a non-empty model box')

  const root = new THREE.Group()
  root.name = 'RocketAnatomySchematicDetailLayer'
  root.visible = false
  root.userData.isSchematicDetailLayer = true

  const size = modelBox.getSize(new THREE.Vector3())
  const center = modelBox.getCenter(new THREE.Vector3())
  const height = Math.max(size.y, 0.001)
  const bodyRadius = Math.max(Math.min(size.x, size.z) * 0.28, height * 0.018)
  const ownedGeometries = new Set()
  const ownedMaterials = new Set()
  const explodedGroups = []
  let sectionEnabled = false
  let explode = 0

  const yAt = normalized => THREE.MathUtils.lerp(modelBox.min.y, modelBox.max.y, normalized)

  const registerGeometry = geometry => {
    ownedGeometries.add(geometry)
    return geometry
  }

  const registerMaterial = material => {
    ownedMaterials.add(material)
    return material
  }

  const makeMaterial = (color, opacity = 0.24) => registerMaterial(new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.42,
    metalness: 0.08,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    clippingPlanes: sectionEnabled ? [sectionPlane] : [],
  }))

  const makeLineMaterial = color => registerMaterial(new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.72,
    clippingPlanes: sectionEnabled ? [sectionPlane] : [],
  }))

  const addExplodable = (object, direction, factor = 1) => {
    object.userData.detailBasePosition = object.position.clone()
    object.userData.detailExplodeDirection = direction.clone().normalize()
    object.userData.detailExplodeFactor = factor
    explodedGroups.push(object)
    root.add(object)
    return object
  }

  const addVolume = ({ id, centerNorm, heightNorm, radiusFactor, color, direction, kind }) => {
    const group = new THREE.Group()
    group.name = id
    group.userData = { anatomyId: id, isSchematic: true, detailKind: kind }
    group.position.set(0, yAt(centerNorm), 0)

    const geometry = registerGeometry(new THREE.CylinderGeometry(
      bodyRadius * radiusFactor,
      bodyRadius * radiusFactor,
      Math.max(height * heightNorm, height * 0.008),
      36,
      1,
      false,
    ))
    const mesh = new THREE.Mesh(geometry, makeMaterial(color))
    mesh.userData = { anatomyId: id, isSchematic: true, detailKind: kind }
    group.add(mesh)

    const edges = registerGeometry(new THREE.EdgesGeometry(geometry, 18))
    const outline = new THREE.LineSegments(edges, makeLineMaterial(color))
    outline.userData = { anatomyId: id, isSchematic: true, detailKind: 'outline' }
    group.add(outline)

    return addExplodable(group, direction, 1)
  }

  const addRing = ({ id, centerNorm, radiusFactor, color, direction }) => {
    const group = new THREE.Group()
    group.name = id
    group.userData = { anatomyId: id, isSchematic: true, detailKind: 'structural-ring' }
    group.position.set(0, yAt(centerNorm), 0)

    const geometry = registerGeometry(new THREE.TorusGeometry(bodyRadius * radiusFactor, bodyRadius * 0.035, 10, 40))
    const mesh = new THREE.Mesh(geometry, makeMaterial(color, 0.34))
    mesh.rotation.x = Math.PI / 2
    mesh.userData = { anatomyId: id, isSchematic: true, detailKind: 'structural-ring' }
    group.add(mesh)
    return addExplodable(group, direction, 0.72)
  }

  addVolume({ id:'sic-rp1-tank', centerNorm:0.17, heightNorm:0.15, radiusFactor:0.86, color:0xe6a85c, direction:new THREE.Vector3(-1,0,0), kind:'reference-volume' })
  addRing({ id:'sic-intertank', centerNorm:0.25, radiusFactor:0.90, color:0xd9e1ea, direction:new THREE.Vector3(1,0,0) })
  addVolume({ id:'sic-lox-tank', centerNorm:0.32, heightNorm:0.12, radiusFactor:0.86, color:0x67b7e1, direction:new THREE.Vector3(1,0,0), kind:'reference-volume' })

  addVolume({ id:'sii-lox-tank', centerNorm:0.465, heightNorm:0.065, radiusFactor:0.84, color:0x67b7e1, direction:new THREE.Vector3(-1,0,0), kind:'reference-volume' })
  addRing({ id:'sii-common-bulkhead', centerNorm:0.50, radiusFactor:0.87, color:0xd9e1ea, direction:new THREE.Vector3(1,0,0) })
  addVolume({ id:'sii-lh2-tank', centerNorm:0.545, heightNorm:0.075, radiusFactor:0.84, color:0x9bd6f5, direction:new THREE.Vector3(1,0,0), kind:'reference-volume' })

  addVolume({ id:'sivb-lox-tank', centerNorm:0.65, heightNorm:0.045, radiusFactor:0.62, color:0x67b7e1, direction:new THREE.Vector3(-1,0,0), kind:'reference-volume' })
  addRing({ id:'sivb-common-bulkhead', centerNorm:0.68, radiusFactor:0.64, color:0xd9e1ea, direction:new THREE.Vector3(1,0,0) })
  addVolume({ id:'sivb-lh2-tank', centerNorm:0.715, heightNorm:0.050, radiusFactor:0.62, color:0x9bd6f5, direction:new THREE.Vector3(1,0,0), kind:'reference-volume' })

  const engineGeometry = registerGeometry(new THREE.ConeGeometry(bodyRadius * 0.12, height * 0.035, 20, 1, true))
  const engineMaterial = makeMaterial(0xb8c4d1, 0.38)
  const engines = new THREE.InstancedMesh(engineGeometry, engineMaterial, 11)
  engines.name = 'schematic-engine-reference-instances'
  engines.userData = { isSchematic: true, detailKind: 'repeated-reference' }
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  let instance = 0

  const addEngineCluster = (count, centerNorm, radiusNorm) => {
    for (let index = 0; index < count; index += 1) {
      const angle = count === 1 ? 0 : (index / count) * Math.PI * 2
      const ringRadius = count === 1 ? 0 : bodyRadius * radiusNorm
      position.set(Math.cos(angle) * ringRadius, yAt(centerNorm), Math.sin(angle) * ringRadius)
      matrix.makeRotationX(Math.PI)
      matrix.setPosition(position)
      engines.setMatrixAt(instance, matrix)
      instance += 1
    }
  }
  addEngineCluster(5, 0.028, 0.50)
  addEngineCluster(5, 0.405, 0.45)
  addEngineCluster(1, 0.620, 0)
  engines.count = instance
  engines.instanceMatrix.needsUpdate = true
  root.add(engines)

  const electronicsGeometry = registerGeometry(new THREE.BoxGeometry(bodyRadius * 0.17, height * 0.012, bodyRadius * 0.09))
  const electronicsMaterial = makeMaterial(0x8ee4ba, 0.42)
  const electronics = new THREE.InstancedMesh(electronicsGeometry, electronicsMaterial, 12)
  electronics.name = 'schematic-iu-electronics-instances'
  electronics.userData = { anatomyId:'iu-electronics-ring', isSchematic:true, detailKind:'repeated-reference' }
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2
    position.set(Math.cos(angle) * bodyRadius * 0.47, yAt(0.78), Math.sin(angle) * bodyRadius * 0.47)
    matrix.makeRotationY(-angle)
    matrix.setPosition(position)
    electronics.setMatrixAt(index, matrix)
  }
  electronics.instanceMatrix.needsUpdate = true
  root.add(electronics)

  const applyExplode = () => {
    const distance = bodyRadius * 1.9 * explode
    for (const object of explodedGroups) {
      object.position.copy(object.userData.detailBasePosition)
      object.position.addScaledVector(
        object.userData.detailExplodeDirection,
        distance * object.userData.detailExplodeFactor,
      )
    }
    root.updateMatrixWorld(true)
  }

  const setSectionEnabled = enabled => {
    sectionEnabled = Boolean(enabled)
    for (const material of ownedMaterials) {
      material.clippingPlanes = sectionEnabled ? [sectionPlane] : []
      material.needsUpdate = true
    }
  }

  const setVisible = visible => {
    root.visible = Boolean(visible)
  }

  const setExplode = value => {
    explode = THREE.MathUtils.clamp(Number(value) || 0, 0, 1)
    applyExplode()
  }

  const stats = () => ({
    volumes: 6,
    structuralRings: 3,
    repeatedInstances: 23,
    totalReferenceObjects: 32,
  })

  const dispose = () => {
    root.removeFromParent()
    for (const geometry of ownedGeometries) geometry.dispose()
    for (const material of ownedMaterials) disposeMaterial(material)
  }

  applyExplode()

  return { root, setVisible, setExplode, setSectionEnabled, stats, dispose }
}
