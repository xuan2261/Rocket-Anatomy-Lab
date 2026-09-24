import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { updateStaticIndexedBounds, firstVisibleAssemblyHit } from '../public/assembly-picking.mjs'

const ray = () => new THREE.Raycaster(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1))
function part(id, z = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial())
  mesh.userData.rocketGroupId = id
  mesh.position.z = z
  return mesh
}

test('partition bounds ignore unused vertices without rewriting geometry', () => {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 0, 1, 0, 0, 100, 0], 3))
  geometry.setIndex([0, 1, 2])
  const positions = Array.from(geometry.attributes.position.array)
  const mesh = new THREE.Mesh(geometry)
  updateStaticIndexedBounds(mesh)
  assert.deepEqual(geometry.boundingBox.min.toArray(), [-1, -1, 0])
  assert.deepEqual(geometry.boundingBox.max.toArray(), [1, 1, 0])
  assert.deepEqual(Array.from(geometry.attributes.position.array), positions)
  assert.deepEqual(Array.from(geometry.index.array), [0, 1, 2])
  assert.ok(geometry.boundingSphere.radius < 2)
})

test('partition bounds respect the active index draw range', () => {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 0, 1, 0, 0, 100, 0], 3))
  geometry.setIndex([3, 3, 3, 0, 1, 2])
  geometry.setDrawRange(3, 3)
  updateStaticIndexedBounds(new THREE.Mesh(geometry))
  assert.equal(geometry.boundingBox.max.y, 1)
})

test('a hidden ancestor cannot intercept a visible assembly behind it', () => {
  const root = new THREE.Group()
  const hidden = new THREE.Group()
  hidden.visible = false
  hidden.add(part('hidden', 1))
  root.add(hidden, part('visible'))
  root.updateMatrixWorld(true)
  assert.equal(firstVisibleAssemblyHit(ray(), root)?.object.userData.rocketGroupId, 'visible')
})

test('hidden leaves, untagged meshes and section helpers are not pick targets', () => {
  const root = new THREE.Group()
  const hidden = part('hidden', 3); hidden.visible = false
  const untagged = part('untagged', 2); delete untagged.userData.rocketGroupId
  const stencil = part('stencil', 1); stencil.userData.rocketSectionStencil = true
  root.add(hidden, untagged, stencil, part('target'))
  root.updateMatrixWorld(true)
  assert.equal(firstVisibleAssemblyHit(ray(), root)?.object.userData.rocketGroupId, 'target')
  root.visible = false
  assert.equal(firstVisibleAssemblyHit(ray(), root), null)
})
