export type SectionAxis = 'x' | 'y' | 'z'

export type SectionState = {
  enabled: boolean
  axis: SectionAxis
  position: number
  inverted: boolean
  capped: boolean
}

export type SectionBounds = {
  min: { x: number; y: number; z: number }
  max: { x: number; y: number; z: number }
}

export type SectionPlaneDescriptor = {
  normal: readonly [number, number, number]
  constant: number
  coordinate: number
  axis: SectionAxis
}

export const createSectionState = (): SectionState => ({
  enabled: false,
  axis: 'y',
  position: 0.5,
  inverted: false,
  capped: true,
})

export const setSectionEnabled = (state: SectionState, enabled: boolean): SectionState => ({
  ...state,
  enabled: Boolean(enabled),
})

export const setSectionAxis = (state: SectionState, axis: SectionAxis): SectionState => {
  if (!['x', 'y', 'z'].includes(axis)) throw new Error(`unsupported section axis: ${axis}`)
  return { ...state, axis }
}

export const setSectionPosition = (state: SectionState, position: number): SectionState => {
  if (!Number.isFinite(position)) throw new Error(`section position must be finite: ${position}`)
  return { ...state, position: Math.min(1, Math.max(0, position)) }
}

export const toggleSectionInverted = (state: SectionState): SectionState => ({
  ...state,
  inverted: !state.inverted,
})

export const setSectionCapped = (state: SectionState, capped: boolean): SectionState => ({
  ...state,
  capped: Boolean(capped),
})

export const resetSection = (): SectionState => createSectionState()

const axisVector = (axis: SectionAxis): readonly [number, number, number] =>
  axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1]

export const sectionCoordinate = (state: SectionState, bounds: SectionBounds): number => {
  const min = bounds.min[state.axis]
  const max = bounds.max[state.axis]
  if (![min, max].every(Number.isFinite) || max < min) {
    throw new Error(`invalid section bounds for axis ${state.axis}`)
  }
  return min + (max - min) * state.position
}

export const sectionPlaneDescriptor = (
  state: SectionState,
  bounds: SectionBounds,
): SectionPlaneDescriptor => {
  const coordinate = sectionCoordinate(state, bounds)
  const base = axisVector(state.axis)
  const sign = state.inverted ? -1 : 1
  const normal = [
    base[0] === 0 ? 0 : base[0] * sign,
    base[1] === 0 ? 0 : base[1] * sign,
    base[2] === 0 ? 0 : base[2] * sign,
  ] as const
  // Three.Plane uses normal.dot(point) + constant = 0.
  // Keeping the same geometric plane while flipping the normal therefore flips the constant too.
  const constant = -coordinate * sign
  return { normal, constant, coordinate, axis: state.axis }
}

export const sectionAriaValueText = (state: SectionState): string => {
  const percent = Math.round(state.position * 100)
  const direction = state.inverted ? 'đảo' : 'chuẩn'
  return `${percent}% theo trục ${state.axis.toUpperCase()}, hướng ${direction}`
}
