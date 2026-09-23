export type GlbQualification = {
  source: string
  sha: string
  byteLength: number
  gltfVersion: number
  nodeCount: number
  meshCount: number
  materialCount: number
  animationCount: number
  rootNodeName: string
  rawNodeNames: string[]
  semanticNaming: 'good' | 'weak' | 'unknown'
  verdict: 'direct-use' | 'needs-semantic-manifest' | 'needs-rework'
}

export const nasaSaturnVQualification: GlbQualification = {
  source: 'nasa/NASA-3D-Resources/3D Models/Saturn V/Saturn V.glb',
  sha: '1299e866c174346d0967cd3fd3250f81515fd522',
  byteLength: 927212,
  gltfVersion: 2,
  nodeCount: 23,
  meshCount: 22,
  materialCount: 13,
  animationCount: 23,
  rootNodeName: 'saturnv_ca',
  rawNodeNames: [
    'group1 gro', 'group1 pCo', 'group10 pC', 'group11 pC', 'group3 gro',
    'group6 pCu', 'group7 pCu', 'group8 pCy', 'group9 pCy', 'pCone2 gro',
    'pCube1 gr1', 'pCube1 gro', 'pCylinder1', 'pCylinder2', 'pCylinder3',
    'pCylinder4', 'pCylinder5', 'polySurfa1', 'polySurfa2', 'polySurfa3',
    'polySurfa4', 'polySurfac', 'saturnv_ca'
  ],
  semanticNaming: 'weak',
  verdict: 'needs-semantic-manifest'
}
