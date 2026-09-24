import type { AnatomyManifest, AnatomyNode } from './anatomy.js'
import { anatomyText } from './anatomy.js'

export type StructureMode = 'model' | 'anatomy'

const normalizeSearchText = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim()

export const anatomyNodeIdFromSearch = (
  search: string,
  validNodeIds: readonly string[],
): string | null => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const id = params.get('anatomy')
  return id && validNodeIds.includes(id) ? id : null
}

export const structureModeFromSearch = (
  search: string,
  validNodeIds: readonly string[],
): StructureMode => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (params.get('structure') === 'anatomy') return 'anatomy'
  return anatomyNodeIdFromSearch(search, validNodeIds) ? 'anatomy' : 'model'
}

export const anatomySearch = (
  search: string,
  nodeId: string | null,
  validNodeIds: readonly string[],
  mode: StructureMode,
  language?: string | null,
): string => {
  if (nodeId && !validNodeIds.includes(nodeId)) throw new Error(`unknown anatomy node id: ${nodeId}`)
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)

  if (mode === 'anatomy') {
    params.set('structure', 'anatomy')
    if (nodeId) params.set('anatomy', nodeId)
  } else {
    params.delete('structure')
    params.delete('anatomy')
  }

  if (language === 'vi' || language === 'en') params.set('lang', language)
  const value = params.toString()
  return value ? `?${value}` : ''
}


export type DetailInspectorState = {
  partId: string | null
  explode: number
  hiddenPartIds: string[]
  ghostOthers: boolean
  onlyPart: boolean
}

export const detailInspectorStateFromSearch = (
  search: string,
  validPartIds: readonly string[],
): DetailInspectorState => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const requestedPart = params.get('detailPart')
  const partId = requestedPart && validPartIds.includes(requestedPart) ? requestedPart : null

  const rawExplode = Number(params.get('detailExplode') ?? 0)
  const explode = Number.isFinite(rawExplode)
    ? Math.min(1, Math.max(0, Math.round(rawExplode) / 100))
    : 0

  const hiddenPartIds = (params.get('detailHidden') ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(value => validPartIds.includes(value))

  return {
    partId,
    explode,
    hiddenPartIds: [...new Set(hiddenPartIds)],
    ghostOthers: params.get('detailGhost') === '1' && Boolean(partId),
    onlyPart: params.get('detailOnly') === '1' && Boolean(partId),
  }
}

export const detailInspectorSearch = (
  search: string,
  state: DetailInspectorState,
): string => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)

  if (state.partId) params.set('detailPart', state.partId)
  else params.delete('detailPart')

  const explodePercent = Math.round(Math.min(1, Math.max(0, state.explode)) * 100)
  if (explodePercent > 0) params.set('detailExplode', String(explodePercent))
  else params.delete('detailExplode')

  const hidden = [...new Set(state.hiddenPartIds)].filter(Boolean)
  if (hidden.length) params.set('detailHidden', hidden.join(','))
  else params.delete('detailHidden')

  if (state.ghostOthers && state.partId) params.set('detailGhost', '1')
  else params.delete('detailGhost')

  if (state.onlyPart && state.partId) params.set('detailOnly', '1')
  else params.delete('detailOnly')

  const value = params.toString()
  return value ? `?${value}` : ''
}

export const filterAnatomyNodes = (
  manifest: AnatomyManifest,
  query: string,
  language: string,
): AnatomyNode[] => {
  const needle = normalizeSearchText(query)
  if (!needle) return []
  return manifest.nodes
    .filter(node => node.id !== manifest.rootId)
    .filter(node => {
      const haystack = normalizeSearchText([
        node.id,
        anatomyText(node.label, language),
        anatomyText(node.description, language),
        node.sourceLabel,
      ].join(' '))
      return haystack.includes(needle)
    })
    .sort((a, b) => {
      const aLabel = normalizeSearchText(anatomyText(a.label, language))
      const bLabel = normalizeSearchText(anatomyText(b.label, language))
      const aStarts = aLabel.startsWith(needle) ? 0 : 1
      const bStarts = bLabel.startsWith(needle) ? 0 : 1
      return aStarts - bStarts || aLabel.localeCompare(bLabel)
    })
}

export const anatomyCameraScale = (node: AnatomyNode): number => {
  if (node.kind === 'component') return 0.92
  if (node.kind === 'system') return 1.02
  if (node.kind === 'stage') return 1.14
  return 1.35
}
