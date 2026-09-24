export type LocalizedDetailLabel = { vi: string; en: string }

export type DetailFit = {
  centerNormalized: number
  targetSizeNormalized: number
}

export type QualifiedDetailAsset = {
  sourceKind: 'direct-glb'
  id: string
  anatomyNodeId: string
  label: LocalizedDetailLabel
  sourceLabel: string
  sourcePageUrl: string
  officialDownloadUrl: string
  githubRawUrl: string
  gitBlobSha: string
  byteLength: number
  localUrl: string
  format: 'glb'
  partCount: 1
  fit: DetailFit
}

export type QualifiedStlPart = {
  id: string
  fileName: string
  githubRawUrl: string
  gitBlobSha: string
  byteLength: number
}

export type GeneratedStageDetailAsset = {
  sourceKind: 'generated-stl-package'
  id: string
  anatomyNodeId: string
  label: LocalizedDetailLabel
  sourceLabel: string
  sourcePageUrl: string
  localUrl: string
  format: 'glb'
  partCount: number
  fit: DetailFit
  sourceParts: readonly QualifiedStlPart[]
}

export type DetailAsset = QualifiedDetailAsset | GeneratedStageDetailAsset

export const qualifiedDetailAssets: readonly QualifiedDetailAsset[] = [
  {
    sourceKind: 'direct-glb',
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
    partCount: 1,
    fit: {
      centerNormalized: 0.82,
      targetSizeNormalized: 0.085,
    },
  },
]

export const generatedStageDetailAssets: readonly GeneratedStageDetailAsset[] = [
  {
    sourceKind: 'generated-stl-package',
    id: 'saturn-v-stage1',
    anatomyNodeId: 'sic-stage',
    label: {
      vi: 'Saturn V Stage 1 — NASA (4 part)',
      en: 'Saturn V Stage 1 — NASA (4 parts)',
    },
    sourceLabel: 'NASA 3D Resources — Saturn V Stage 1',
    sourcePageUrl: 'https://science.nasa.gov/3d-resources/saturn-v-stage-1/',
    localUrl: './assets/detail/saturn-v-stage1.glb',
    format: 'glb',
    partCount: 4,
    fit: {
      centerNormalized: 0.20,
      targetSizeNormalized: 0.39,
    },
    sourceParts: [
      {
        id: 'stage1-top-a',
        fileName: 'top part a.stl',
        githubRawUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Printing/Saturn%20V%20-%20Stage%201/top%20part%20a.stl',
        gitBlobSha: 'f47673de304c89cc20c92630efc7219741d588b4',
        byteLength: 491684,
      },
      {
        id: 'stage1-top-b',
        fileName: 'top part b.stl',
        githubRawUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Printing/Saturn%20V%20-%20Stage%201/top%20part%20b.stl',
        gitBlobSha: 'b42b34e2bebe0f678edbb38143b894cf5503a489',
        byteLength: 330184,
      },
      {
        id: 'stage1-bottom-a',
        fileName: 'bottom part a.stl',
        githubRawUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Printing/Saturn%20V%20-%20Stage%201/bottom%20part%20a.stl',
        gitBlobSha: '03de4977bb9e3a054578b9bcd1bf7a7317c8e7a6',
        byteLength: 299784,
      },
      {
        id: 'stage1-bottom-b',
        fileName: 'bottom part b.stl',
        githubRawUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Printing/Saturn%20V%20-%20Stage%201/bottom%20part%20b.stl',
        gitBlobSha: '48d8a0d192bc25b6c2ab4efd0218f17579ba20f4',
        byteLength: 1790934,
      },
    ],
  },
  {
    sourceKind: 'generated-stl-package',
    id: 'saturn-v-stage2',
    anatomyNodeId: 'sii-stage',
    label: {
      vi: 'Saturn V Stage 2 — NASA (3 part)',
      en: 'Saturn V Stage 2 — NASA (3 parts)',
    },
    sourceLabel: 'NASA 3D Resources — Saturn V Stage 2',
    sourcePageUrl: 'https://science.nasa.gov/3d-resources/saturn-v-stage-2/',
    localUrl: './assets/detail/saturn-v-stage2.glb',
    format: 'glb',
    partCount: 3,
    fit: {
      centerNormalized: 0.50,
      targetSizeNormalized: 0.25,
    },
    sourceParts: [
      {
        id: 'stage2-top',
        fileName: 'top.stl',
        githubRawUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Printing/Saturn%20V%20-%20Stage%202/top.stl',
        gitBlobSha: '74ca03ddd7034ff6b51079b7deadba9c8f7339f8',
        byteLength: 512684,
      },
      {
        id: 'stage2-joining-cube',
        fileName: 'joining cube.stl',
        githubRawUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Printing/Saturn%20V%20-%20Stage%202/joining%20cube.stl',
        gitBlobSha: 'a0626f462ef31652a676816ae37c1f814c04cb5d',
        byteLength: 684,
      },
      {
        id: 'stage2-bottom',
        fileName: 'bottom.stl',
        githubRawUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Printing/Saturn%20V%20-%20Stage%202/bottom.stl',
        gitBlobSha: '70b357540821047577c9d107bd3bca2da7e0f9d3',
        byteLength: 1380284,
      },
    ],
  },
]

export const allDetailAssets: readonly DetailAsset[] = [
  ...qualifiedDetailAssets,
  ...generatedStageDetailAssets,
]

export const detailAssetForNode = (nodeId: string): DetailAsset | null =>
  allDetailAssets.find(asset => asset.anatomyNodeId === nodeId) ?? null

export const validateDetailAssetManifest = (assets: readonly QualifiedDetailAsset[]): string[] => {
  const errors: string[] = []
  const ids = new Set<string>()
  const nodes = new Set<string>()

  for (const asset of assets) {
    if (asset.sourceKind !== 'direct-glb') errors.push(`${asset.id}: sourceKind must be direct-glb`)
    if (!asset.id.trim()) errors.push('detail asset id must be non-empty')
    if (ids.has(asset.id)) errors.push(`duplicate detail asset id: ${asset.id}`)
    ids.add(asset.id)

    if (!asset.anatomyNodeId.trim()) errors.push(`${asset.id}: anatomyNodeId is required`)
    if (nodes.has(asset.anatomyNodeId)) errors.push(`duplicate detail anatomy node: ${asset.anatomyNodeId}`)
    nodes.add(asset.anatomyNodeId)

    if (!/^[0-9a-f]{40}$/.test(asset.gitBlobSha)) errors.push(`${asset.id}: gitBlobSha must be a 40-char hex SHA-1`)
    if (!Number.isInteger(asset.byteLength) || asset.byteLength <= 12) errors.push(`${asset.id}: byteLength must be > GLB header size`)
    if (!asset.localUrl.startsWith('./assets/detail/')) errors.push(`${asset.id}: localUrl must live under ./assets/detail/`)
    if (asset.format !== 'glb') errors.push(`${asset.id}: only GLB is supported`)
    if (asset.partCount !== 1) errors.push(`${asset.id}: direct GLB assets must declare partCount=1`)
    if (!/^https:\/\/science\.nasa\.gov\//.test(asset.sourcePageUrl)) errors.push(`${asset.id}: sourcePageUrl must use NASA Science`)
    if (!/^https:\/\/assets\.science\.nasa\.gov\//.test(asset.officialDownloadUrl)) errors.push(`${asset.id}: officialDownloadUrl must use NASA Science assets`)
    if (!/^https:\/\/raw\.githubusercontent\.com\/nasa\/NASA-3D-Resources\//.test(asset.githubRawUrl)) errors.push(`${asset.id}: githubRawUrl must use nasa/NASA-3D-Resources`)
    if (!Number.isFinite(asset.fit.centerNormalized) || asset.fit.centerNormalized < 0 || asset.fit.centerNormalized > 1) errors.push(`${asset.id}: centerNormalized must be within 0..1`)
    if (!Number.isFinite(asset.fit.targetSizeNormalized) || asset.fit.targetSizeNormalized <= 0 || asset.fit.targetSizeNormalized > 0.25) errors.push(`${asset.id}: targetSizeNormalized must be within 0..0.25`)
  }

  return errors
}

export const validateGeneratedStageDetailManifest = (assets: readonly GeneratedStageDetailAsset[]): string[] => {
  const errors: string[] = []
  const ids = new Set<string>()
  const nodes = new Set<string>()

  for (const asset of assets) {
    if (asset.sourceKind !== 'generated-stl-package') errors.push(`${asset.id}: sourceKind must be generated-stl-package`)
    if (!asset.id.trim()) errors.push('generated detail asset id must be non-empty')
    if (ids.has(asset.id)) errors.push(`duplicate generated detail asset id: ${asset.id}`)
    ids.add(asset.id)
    if (nodes.has(asset.anatomyNodeId)) errors.push(`duplicate generated detail anatomy node: ${asset.anatomyNodeId}`)
    nodes.add(asset.anatomyNodeId)
    if (!/^https:\/\/science\.nasa\.gov\//.test(asset.sourcePageUrl)) errors.push(`${asset.id}: sourcePageUrl must use NASA Science`)
    if (!asset.localUrl.startsWith('./assets/detail/')) errors.push(`${asset.id}: localUrl must live under ./assets/detail/`)
    if (asset.format !== 'glb') errors.push(`${asset.id}: generated package format must be glb`)
    if (asset.partCount !== asset.sourceParts.length || asset.partCount < 2) errors.push(`${asset.id}: partCount must match sourceParts and be >=2`)
    if (!Number.isFinite(asset.fit.centerNormalized) || asset.fit.centerNormalized < 0 || asset.fit.centerNormalized > 1) errors.push(`${asset.id}: centerNormalized must be within 0..1`)
    if (!Number.isFinite(asset.fit.targetSizeNormalized) || asset.fit.targetSizeNormalized <= 0 || asset.fit.targetSizeNormalized > 0.5) errors.push(`${asset.id}: targetSizeNormalized must be within 0..0.5`)

    const partIds = new Set<string>()
    for (const part of asset.sourceParts) {
      if (partIds.has(part.id)) errors.push(`${asset.id}: duplicate part id ${part.id}`)
      partIds.add(part.id)
      if (!part.fileName.toLowerCase().endsWith('.stl')) errors.push(`${asset.id}/${part.id}: fileName must end in .stl`)
      if (!/^[0-9a-f]{40}$/.test(part.gitBlobSha)) errors.push(`${asset.id}/${part.id}: invalid gitBlobSha`)
      if (!Number.isInteger(part.byteLength) || part.byteLength <= 0) errors.push(`${asset.id}/${part.id}: byteLength must be positive`)
      if (!/^https:\/\/raw\.githubusercontent\.com\/nasa\/NASA-3D-Resources\//.test(part.githubRawUrl)) errors.push(`${asset.id}/${part.id}: githubRawUrl must use nasa/NASA-3D-Resources`)
    }
  }

  return errors
}
