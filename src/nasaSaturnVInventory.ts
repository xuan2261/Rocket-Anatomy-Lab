export type VerifiedNodeInventoryEntry = {
  name: string
  meshIndex: number
  primitiveCount: number
  minY: number
  maxY: number
}

// Snapshot derived from the official NASA-3D-Resources Saturn V GLB at the
// pinned Git blob below. It is evidence for mapping stability, not a replacement
// for the source asset.
export const nasaSaturnVVerifiedInventory = {
  repository: 'nasa/NASA-3D-Resources',
  path: '3D Models/Saturn V/Saturn V.glb',
  gitSha: '1299e866c174346d0967cd3fd3250f81515fd522',
  gltfVersion: 2,
  nodeCount: 23,
  renderableNodeCount: 22,
  meshCount: 22,
  materialCount: 13,
  animationCount: 23,
  globalBounds: {
    min: [-1.0194059610366821, -0.1408900022506714, -0.26409798860549927] as const,
    max: [0.9948959946632385, 12.84592342376709, 1.7502039670944214] as const,
  },
  nodes: [
    { name: 'group1 gro', meshIndex: 0, primitiveCount: 3, minY: 0.11738599836826324, maxY: 1.2429009675979614 },
    { name: 'group1 pCo', meshIndex: 1, primitiveCount: 3, minY: 0.11738599836826324, maxY: 1.2429009675979614 },
    { name: 'group10 pC', meshIndex: 2, primitiveCount: 1, minY: 11.187453269958496, maxY: 11.307201385498047 },
    { name: 'group11 pC', meshIndex: 3, primitiveCount: 1, minY: 11.187453269958496, maxY: 11.307201385498047 },
    { name: 'group3 gro', meshIndex: 4, primitiveCount: 3, minY: 0.11738599836826324, maxY: 1.2429009675979614 },
    { name: 'group6 pCu', meshIndex: 5, primitiveCount: 2, minY: 0.27873799204826355, maxY: 0.6888309717178345 },
    { name: 'group7 pCu', meshIndex: 6, primitiveCount: 2, minY: 0.27873799204826355, maxY: 0.6888309717178345 },
    { name: 'group8 pCy', meshIndex: 7, primitiveCount: 1, minY: 5.724888801574707, maxY: 7.727705955505371 },
    { name: 'group9 pCy', meshIndex: 8, primitiveCount: 1, minY: 5.724881172180176, maxY: 7.727697849273682 },
    { name: 'pCone2 gro', meshIndex: 9, primitiveCount: 3, minY: 0.11738599836826324, maxY: 1.2429009675979614 },
    { name: 'pCube1 gr1', meshIndex: 10, primitiveCount: 2, minY: 0.27873799204826355, maxY: 0.6888309717178345 },
    { name: 'pCube1 gro', meshIndex: 11, primitiveCount: 2, minY: 0.27873799204826355, maxY: 0.6888309717178345 },
    { name: 'pCylinder1', meshIndex: 12, primitiveCount: 9, minY: 0.27979400753974915, maxY: 12.84592342376709 },
    { name: 'pCylinder2', meshIndex: 13, primitiveCount: 1, minY: 1.9315199851989746, maxY: 4.343688011169434 },
    { name: 'pCylinder3', meshIndex: 14, primitiveCount: 1, minY: 1.929381012916565, maxY: 4.341548919677734 },
    { name: 'pCylinder4', meshIndex: 15, primitiveCount: 1, minY: 11.187453269958496, maxY: 11.307201385498047 },
    { name: 'pCylinder5', meshIndex: 16, primitiveCount: 1, minY: 11.187453269958496, maxY: 11.307201385498047 },
    { name: 'polySurfa1', meshIndex: 17, primitiveCount: 3, minY: -0.1408900022506714, maxY: 0.4365540146827698 },
    { name: 'polySurfa2', meshIndex: 18, primitiveCount: 3, minY: -0.1408900022506714, maxY: 0.4365540146827698 },
    { name: 'polySurfa3', meshIndex: 19, primitiveCount: 3, minY: -0.1408900022506714, maxY: 0.4365540146827698 },
    { name: 'polySurfa4', meshIndex: 20, primitiveCount: 3, minY: -0.1408900022506714, maxY: 0.4365540146827698 },
    { name: 'polySurfac', meshIndex: 21, primitiveCount: 3, minY: -0.1408900022506714, maxY: 0.4365540146827698 },
  ] as const satisfies readonly VerifiedNodeInventoryEntry[],
}

export const verifiedRenderableNodeNames = nasaSaturnVVerifiedInventory.nodes.map(node => node.name)

export const primaryBodyLongitudinalCoverage = (): number => {
  const body = nasaSaturnVVerifiedInventory.nodes.find(node => node.name === 'pCylinder1')
  if (!body) return 0
  const globalSpan = nasaSaturnVVerifiedInventory.globalBounds.max[1] - nasaSaturnVVerifiedInventory.globalBounds.min[1]
  return (body.maxY - body.minY) / globalSpan
}
