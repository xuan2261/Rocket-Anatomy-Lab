export type TimelineDirection = 'forward' | 'reverse'
export type TimelinePlayback = 'stopped' | 'playing' | 'paused'

export type TimelineState = {
  assemblyIds: readonly string[]
  stepIndex: number
  direction: TimelineDirection
  playback: TimelinePlayback
  progress: number
  focusedAssemblyId: string | null
  reducedMotion: boolean
}

export type TimelineAssemblyView = {
  id: string
  amount: number
  active: boolean
}

export const validateTimelineAssemblyIds = (assemblyIds: readonly string[]): string[] => {
  const errors: string[] = []
  if (!assemblyIds.length) return ['timeline requires at least one assembly id']
  const seen = new Set<string>()
  for (const id of assemblyIds) {
    if (!id.trim()) errors.push('timeline assembly ids must be non-empty')
    if (seen.has(id)) errors.push(`duplicate timeline assembly id: ${id}`)
    seen.add(id)
  }
  return errors
}

export const createTimelineState = (
  assemblyIds: readonly string[],
  reducedMotion = false,
): TimelineState => {
  const errors = validateTimelineAssemblyIds(assemblyIds)
  if (errors.length) throw new Error(errors.join('; '))
  return {
    assemblyIds: [...assemblyIds],
    stepIndex: 0,
    direction: 'forward',
    playback: 'stopped',
    progress: 0,
    focusedAssemblyId: null,
    reducedMotion,
  }
}

const normalize = (state: TimelineState, stepIndex: number, focusedAssemblyId: string | null): TimelineState => {
  const clamped = Math.min(state.assemblyIds.length, Math.max(0, stepIndex))
  return {
    ...state,
    stepIndex: clamped,
    progress: state.assemblyIds.length ? clamped / state.assemblyIds.length : 0,
    focusedAssemblyId,
  }
}

export const canAdvanceTimeline = (state: TimelineState): boolean =>
  state.direction === 'forward'
    ? state.stepIndex < state.assemblyIds.length
    : state.stepIndex > 0

export const canRetreatTimeline = (state: TimelineState): boolean =>
  state.direction === 'forward'
    ? state.stepIndex > 0
    : state.stepIndex < state.assemblyIds.length

const crossedAssemblyId = (state: TimelineState, fromStep: number, toStep: number): string | null => {
  if (toStep === fromStep) return null
  const index = toStep > fromStep ? fromStep : toStep
  return state.assemblyIds[index] ?? null
}

export const advanceTimeline = (state: TimelineState): TimelineState => {
  if (!canAdvanceTimeline(state)) return { ...state, playback: 'stopped' }
  const delta = state.direction === 'forward' ? 1 : -1
  const nextStep = state.stepIndex + delta
  return normalize(state, nextStep, crossedAssemblyId(state, state.stepIndex, nextStep))
}

export const retreatTimeline = (state: TimelineState): TimelineState => {
  if (!canRetreatTimeline(state)) return state
  const delta = state.direction === 'forward' ? -1 : 1
  const nextStep = state.stepIndex + delta
  return normalize(state, nextStep, crossedAssemblyId(state, state.stepIndex, nextStep))
}

export const seekTimeline = (state: TimelineState, stepIndex: number): TimelineState => {
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > state.assemblyIds.length) {
    throw new Error(`timeline step out of range: ${stepIndex}`)
  }
  return normalize(state, stepIndex, crossedAssemblyId(state, state.stepIndex, stepIndex))
}

export const restartTimeline = (state: TimelineState): TimelineState => ({
  ...normalize(state, 0, null),
  direction: 'forward',
  playback: 'stopped',
})

export const setTimelineDirection = (
  state: TimelineState,
  direction: TimelineDirection,
): TimelineState => ({
  ...state,
  direction,
  playback: state.playback === 'playing' ? 'paused' : state.playback,
})

export const toggleTimelineDirection = (state: TimelineState): TimelineState =>
  setTimelineDirection(state, state.direction === 'forward' ? 'reverse' : 'forward')

export const playTimeline = (state: TimelineState): TimelineState =>
  canAdvanceTimeline(state) ? { ...state, playback: 'playing' } : { ...state, playback: 'stopped' }

export const pauseTimeline = (state: TimelineState): TimelineState => ({
  ...state,
  playback: state.playback === 'playing' ? 'paused' : state.playback,
})

export const stopTimeline = (state: TimelineState): TimelineState => ({ ...state, playback: 'stopped' })

export const setTimelineReducedMotion = (state: TimelineState, reducedMotion: boolean): TimelineState => ({
  ...state,
  reducedMotion,
})

export const focusTimelineAssembly = (state: TimelineState, assemblyId: string | null): TimelineState => {
  if (assemblyId !== null && !state.assemblyIds.includes(assemblyId)) {
    throw new Error(`unknown timeline assembly id: ${assemblyId}`)
  }
  return { ...state, focusedAssemblyId: assemblyId }
}

export const timelineAssemblyViews = (state: TimelineState): TimelineAssemblyView[] =>
  state.assemblyIds.map((id, index) => ({
    id,
    amount: index < state.stepIndex ? 1 : 0,
    active: id === state.focusedAssemblyId,
  }))

export const timelineAssemblyAmounts = (state: TimelineState): Map<string, number> =>
  new Map(timelineAssemblyViews(state).map(view => [view.id, view.amount]))

export const orderedAssemblyIds = (state: TimelineState): string[] =>
  state.direction === 'forward' ? [...state.assemblyIds] : [...state.assemblyIds].reverse()

export const standardTransitionDurationMs = (state: TimelineState): number => state.reducedMotion ? 0 : 320
export const cameraTransitionDurationMs = (state: TimelineState): number => state.reducedMotion ? 0 : 480
