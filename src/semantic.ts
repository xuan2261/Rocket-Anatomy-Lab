import type { ViewerMode, ViewerState } from './types.js'

export type SemanticEvidence = {
  basis: 'verified-geometry' | 'reviewed-preview' | 'fallback-geometry'
  note: string
}

export type SemanticGroup = {
  id: string
  label: string
  description: string
  bandIndex: number
  explodeSignedFactor: number
  nodeNames?: readonly string[]
  evidence?: SemanticEvidence
}

export type AssetFingerprint = {
  repository: string
  path: string
  gitSha: string
  expectedNodeNames: readonly string[]
  expectedNodeCount: number
  expectedMeshCount: number
  primaryAxis: 'x' | 'y' | 'z'
}

export type SemanticManifest = {
  id: string
  label: string
  sourceLabel: string
  educationalOnly: true
  mappingKind: 'geometric-bands' | 'curated-node-map' | 'assembly-node-map'
  groups: SemanticGroup[]
  assetFingerprint?: AssetFingerprint
}

export type SemanticGroupViewState = {
  id: string
  visible: boolean
  selected: boolean
  opacity: number
  wireframe: boolean
  explodeSignedFactor: number
}

export const nasaSaturnVGeometricManifest: SemanticManifest = {
  id: 'nasa-saturn-v-geometric-bands',
  label: 'NASA Saturn V — geometric inspection bands',
  sourceLabel: 'NASA 3D Resources / Michael D. Carbajal',
  educationalOnly: true,
  mappingKind: 'geometric-bands',
  groups: [
    {
      id: 'band-0',
      label: 'End band A',
      description: 'One end of the imported model, grouped automatically by geometry. Not a historical stage label.',
      bandIndex: 0,
      explodeSignedFactor: -1.0,
    },
    {
      id: 'band-1',
      label: 'Inner band A',
      description: 'Second geometric band along the model’s longest axis. Not a historical stage label.',
      bandIndex: 1,
      explodeSignedFactor: -0.5,
    },
    {
      id: 'band-2',
      label: 'Center band',
      description: 'Center geometric band used for selection, hide/show and X-ray inspection.',
      bandIndex: 2,
      explodeSignedFactor: 0,
    },
    {
      id: 'band-3',
      label: 'Inner band B',
      description: 'Fourth geometric band along the model’s longest axis. Not a historical stage label.',
      bandIndex: 3,
      explodeSignedFactor: 0.5,
    },
    {
      id: 'band-4',
      label: 'End band B',
      description: 'The opposite end of the imported model, grouped automatically by geometry. Not a historical stage label.',
      bandIndex: 4,
      explodeSignedFactor: 1.0,
    },
  ],
}

export const semanticGroupViewState = (
  group: SemanticGroup,
  state: ViewerState,
): SemanticGroupViewState => {
  const selected = state.selectedId === group.id
  const visibleByIsolation = state.isolatedId ? state.isolatedId === group.id : true
  const visible = visibleByIsolation && !state.hiddenIds.has(group.id)
  const hasVisibleSelection = Boolean(state.selectedId)
    && !state.hiddenIds.has(state.selectedId as string)
    && (!state.isolatedId || state.isolatedId === state.selectedId)
  const opacity = opacityForMode(state.mode, selected, hasVisibleSelection)
  return {
    id: group.id,
    visible,
    selected,
    opacity,
    wireframe: state.mode === 'xray' && !selected,
    explodeSignedFactor: group.explodeSignedFactor * state.explode,
  }
}

export const deriveSemanticView = (
  manifest: SemanticManifest,
  state: ViewerState,
): SemanticGroupViewState[] => manifest.groups.map(group => semanticGroupViewState(group, state))

export const curatedNodeMap = (manifest: SemanticManifest): Map<string, string> => {
  const out = new Map<string, string>()
  for (const group of manifest.groups) {
    for (const nodeName of group.nodeNames ?? []) out.set(nodeName, group.id)
  }
  return out
}

export const validateCuratedCoverage = (
  manifest: SemanticManifest,
  actualNodeNames: readonly string[],
): string[] => {
  if (manifest.mappingKind !== 'curated-node-map') return ['manifest is not a curated-node-map']
  const errors: string[] = []
  const seen = new Map<string, string>()
  for (const group of manifest.groups) {
    for (const nodeName of group.nodeNames ?? []) {
      const prior = seen.get(nodeName)
      if (prior) errors.push(`node mapped more than once: ${nodeName} (${prior}, ${group.id})`)
      else seen.set(nodeName, group.id)
    }
  }
  const actual = new Set(actualNodeNames)
  for (const name of actual) if (!seen.has(name)) errors.push(`unmapped node: ${name}`)
  for (const name of seen.keys()) if (!actual.has(name)) errors.push(`mapped node not present in asset: ${name}`)
  return errors
}

export const validateSemanticManifest = (manifest: SemanticManifest): string[] => {
  const errors: string[] = []
  const ids = new Set<string>()
  const bands = new Set<number>()
  if (!manifest.groups.length) errors.push('semantic manifest must contain at least one group')
  for (const group of manifest.groups) {
    if (ids.has(group.id)) errors.push(`duplicate semantic group id: ${group.id}`)
    ids.add(group.id)
    if (!Number.isInteger(group.bandIndex) || group.bandIndex < 0) {
      errors.push(`${group.id}: bandIndex must be a non-negative integer`)
    }
    if (bands.has(group.bandIndex)) errors.push(`duplicate bandIndex: ${group.bandIndex}`)
    bands.add(group.bandIndex)
    if (!Number.isFinite(group.explodeSignedFactor)) {
      errors.push(`${group.id}: explodeSignedFactor must be finite`)
    }
    if (manifest.mappingKind === 'curated-node-map' && !(group.nodeNames?.length)) {
      errors.push(`${group.id}: curated group must list at least one node name`)
    }
  }
  if (manifest.mappingKind === 'curated-node-map' && !manifest.assetFingerprint) {
    errors.push('curated-node-map requires an assetFingerprint')
  }
  return errors
}

const opacityForMode = (mode: ViewerMode, selected: boolean, hasSelection: boolean): number => {
  if (mode === 'ghost') return selected ? 1 : 0.34
  if (mode === 'xray') return selected ? 1 : 0.14
  if (hasSelection) return selected ? 1 : 0.52
  return 1
}
