import type { ModelManifest, PartDefinition, PartViewState, Vec3, ViewerMode, ViewerState } from './types.js'

export const initialState = (): ViewerState => ({
  selectedId: null,
  hiddenIds: new Set<string>(),
  isolatedId: null,
  mode: 'normal',
  explode: 0,
})

export const selectPart = (state: ViewerState, id: string | null): ViewerState => ({
  ...state,
  selectedId: id,
})

export const setExplode = (state: ViewerState, amount: number): ViewerState => ({
  ...state,
  explode: clamp(amount, 0, 1),
})

export const setMode = (state: ViewerState, mode: ViewerMode): ViewerState => ({
  ...state,
  mode,
})

export const toggleHidden = (state: ViewerState, id: string): ViewerState => {
  const next = new Set(state.hiddenIds)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return { ...state, hiddenIds: next, isolatedId: state.isolatedId === id ? null : state.isolatedId }
}

export const toggleIsolate = (state: ViewerState, id: string): ViewerState => ({
  ...state,
  selectedId: id,
  isolatedId: state.isolatedId === id ? null : id,
})

export const showAll = (state: ViewerState): ViewerState => ({
  ...state,
  hiddenIds: new Set<string>(),
  isolatedId: null,
})

export const resetViewer = (): ViewerState => initialState()

export const partViewState = (part: PartDefinition, state: ViewerState): PartViewState => {
  const selected = state.selectedId === part.id
  const visibleByIsolation = state.isolatedId ? state.isolatedId === part.id : true
  const visible = visibleByIsolation && !state.hiddenIds.has(part.id)

  let opacity = 1
  if (state.mode === 'ghost') opacity = selected ? 1 : 0.32
  if (state.mode === 'xray') opacity = selected ? 1 : 0.16

  const offset = scaleVec(part.explode.axis, part.explode.distance * state.explode)
  return { id: part.id, visible, selected, opacity, offset }
}

export const deriveView = (manifest: ModelManifest, state: ViewerState): PartViewState[] =>
  manifest.parts.map(part => partViewState(part, state))

export const validateManifest = (manifest: ModelManifest): string[] => {
  const errors: string[] = []
  const ids = new Set<string>()
  if (!manifest.parts.length) errors.push('manifest must contain at least one part')
  for (const part of manifest.parts) {
    if (ids.has(part.id)) errors.push(`duplicate part id: ${part.id}`)
    ids.add(part.id)
    if (part.geometry.height <= 0) errors.push(`${part.id}: height must be > 0`)
    if (part.geometry.radiusBottom <= 0 || part.geometry.radiusTop < 0) {
      errors.push(`${part.id}: radii must be non-negative and bottom radius > 0`)
    }
    const len = Math.hypot(...part.explode.axis)
    if (Math.abs(len - 1) > 1e-6) errors.push(`${part.id}: explode axis must be normalized`)
    if (part.explode.distance < 0) errors.push(`${part.id}: explode distance must be >= 0`)
  }
  return errors
}

const scaleVec = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s]
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
