export type QualifiedDetailAsset = {
  id: string
  anatomyNodeId: string
  label: { vi: string; en: string }
  sourceLabel: string
  sourcePageUrl: string
  officialDownloadUrl: string
  githubRawUrl: string
  gitBlobSha: string
  byteLength: number
  localUrl: string
  format: 'glb'
  fit: {
    centerNormalized: number
    targetSizeNormalized: number
  }
}

export const qualifiedDetailAssets: readonly QualifiedDetailAsset[] = [
  {
    id: 'apollo-lunar-module',
    anatomyNodeId: 'apollo-lm-sla',
    label: {
      vi: 'Apollo Lunar Module — NASA',
      en: 'Apollo Lunar Module — NASA',
    },
    sourceLabel: 'NASA 3D Resources / Michael D. Carbajal',
    sourcePageUrl: 'https://science.nasa.gov/3d-resources/apollo-lunar-module/',
    officialDownloadUrl: 'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/apollo-lunar-module/Apollo%20Lunar%20Module.glb',
    githubRawUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Apollo%20Lunar%20Module/Apollo%20Lunar%20Module.glb',
    gitBlobSha: '74b7b99a60f9903a0592fd763ed14482204e24d9',
    byteLength: 716840,
    localUrl: './assets/detail/apollo-lunar-module.glb',
    format: 'glb',
    fit: {
      centerNormalized: 0.82,
      targetSizeNormalized: 0.085,
    },
  },
]

export const detailAssetForNode = (nodeId: string): QualifiedDetailAsset | null =>
  qualifiedDetailAssets.find(asset => asset.anatomyNodeId === nodeId) ?? null

export const validateDetailAssetManifest = (assets: readonly QualifiedDetailAsset[]): string[] => {
  const errors: string[] = []
  const ids = new Set<string>()
  const nodes = new Set<string>()

  for (const asset of assets) {
    if (!asset.id.trim()) errors.push('detail asset id must be non-empty')
    if (ids.has(asset.id)) errors.push(`duplicate detail asset id: ${asset.id}`)
    ids.add(asset.id)

    if (!asset.anatomyNodeId.trim()) errors.push(`${asset.id}: anatomyNodeId is required`)
    if (nodes.has(asset.anatomyNodeId)) errors.push(`duplicate detail anatomy node: ${asset.anatomyNodeId}`)
    nodes.add(asset.anatomyNodeId)

    if (!/^[0-9a-f]{40}$/.test(asset.gitBlobSha)) errors.push(`${asset.id}: gitBlobSha must be a 40-char hex SHA-1`)
    if (!Number.isInteger(asset.byteLength) || asset.byteLength <= 12) errors.push(`${asset.id}: byteLength must be > GLB header size`)
    if (!asset.localUrl.startsWith('./assets/detail/')) errors.push(`${asset.id}: localUrl must live under ./assets/detail/`)
    if (asset.format !== 'glb') errors.push(`${asset.id}: only GLB is supported in Phase 15`)
    if (!/^https:\/\/(?:science\.nasa\.gov|assets\.science\.nasa\.gov)\//.test(asset.sourcePageUrl) &&
        !/^https:\/\/science\.nasa\.gov\//.test(asset.sourcePageUrl)) {
      errors.push(`${asset.id}: sourcePageUrl must be an official NASA Science URL`)
    }
    if (!/^https:\/\/assets\.science\.nasa\.gov\//.test(asset.officialDownloadUrl)) {
      errors.push(`${asset.id}: officialDownloadUrl must use NASA Science assets`)
    }
    if (!/^https:\/\/raw\.githubusercontent\.com\/nasa\/NASA-3D-Resources\//.test(asset.githubRawUrl)) {
      errors.push(`${asset.id}: githubRawUrl must use nasa/NASA-3D-Resources`)
    }
    if (!Number.isFinite(asset.fit.centerNormalized) || asset.fit.centerNormalized < 0 || asset.fit.centerNormalized > 1) {
      errors.push(`${asset.id}: centerNormalized must be within 0..1`)
    }
    if (!Number.isFinite(asset.fit.targetSizeNormalized) || asset.fit.targetSizeNormalized <= 0 || asset.fit.targetSizeNormalized > 0.25) {
      errors.push(`${asset.id}: targetSizeNormalized must be within 0..0.25`)
    }
  }

  return errors
}
