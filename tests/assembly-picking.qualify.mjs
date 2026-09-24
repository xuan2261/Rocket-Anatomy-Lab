import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { updateStaticIndexedBounds, firstVisibleAssemblyHit } from '../public/assembly-picking.mjs'

test('qualified GLB: all five focused assemblies have a real center-ray hit', async () => {
  // CPU geometry qualification, not a visual test: skip only image decoding.
  // The pinned GLB, index/position buffers, transforms and material sides are real.
  const loader = new GLTFLoader()
  loader.register(parser => {
    parser.loadTextureImage = () => Promise.resolve(null)
    return { name: 'CPU_GEOMETRY_ONLY' }
  })
  const bytes = fs.readFileSync(new URL('../public/assets/saturn-v-education.glb', import.meta.url))
  const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  const root = gltf.scene
  const groups = new Map()
  root.traverse(object => {
    const id = object.userData.rocketAssemblyId
    if (id && object.parent?.userData.rocketAssemblyId !== id) groups.set(id, object)
  })
  assert.equal(groups.size, 5)
  for (const [id, object] of groups) object.traverse(child => { child.userData.rocketGroupId = id })
  const bufferDigest = () => {
    const hash = crypto.createHash('sha256')
    root.traverse(object => {
      if (!object.isMesh) return
      for (const attribute of [object.geometry.index, object.geometry.attributes.position]) {
        if (attribute) hash.update(Buffer.from(attribute.array.buffer, attribute.array.byteOffset, attribute.array.byteLength))
      }
    })
    return hash.digest('hex')
  }
  const before = bufferDigest()
  updateStaticIndexedBounds(root)
  assert.equal(bufferDigest(), before, 'bounds repair must not edit triangle or vertex data')
  root.updateMatrixWorld(true)
  const baseBox = new THREE.Box3().setFromObject(groups.get('base-assembly'))
  assert.ok(baseBox.max.y < 3, 'base focus must not include unused vertices near the nose')
  for (const aspect of [858 / 613, 396 / 337]) {
    for (const [id, group] of groups) {
      const sphere = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere())
      const camera = new THREE.PerspectiveCamera(42, aspect, 0.001, 1000)
      camera.position.copy(sphere.center).addScaledVector(new THREE.Vector3(1, 0.65, 1.25).normalize(), sphere.radius / Math.sin(THREE.MathUtils.degToRad(21)) * 1.45)
      camera.lookAt(sphere.center)
      camera.updateMatrixWorld(true)
      const pointerRay = new THREE.Raycaster()
      pointerRay.setFromCamera(new THREE.Vector2(0, 0), camera)
      assert.equal(firstVisibleAssemblyHit(pointerRay, root)?.object.userData.rocketGroupId, id, `${id}, aspect ${aspect}`)
    }
  }
})
