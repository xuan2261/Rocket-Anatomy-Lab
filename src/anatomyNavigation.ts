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
