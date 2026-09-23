export type AssemblyAxis = 'x' | 'y' | 'z'

export type AssemblySegment = {
  id: string
  label: string
  description: string
  start: number
  end: number
  explodeSignedFactor: number
}

export type AssemblySourceFingerprint = {
  repository: string
  path: string
  gitSha: string
  sha256: string
  byteLength: number
  officialDownloadUrl: string
  githubRawUrl: string
  primaryAxis: AssemblyAxis
  bounds: {
    min: readonly [number, number, number]
    max: readonly [number, number, number]
  }
}

export type AssemblyManifest = {
  id: string
  label: string
  sourceLabel: string
  educationalOnly: true
  methodology: 'normalized-axis-triangle-partition'
  source: AssemblySourceFingerprint
  segments: readonly AssemblySegment[]
}

export const validateAssemblyManifest = (manifest: AssemblyManifest): string[] => {
  const errors: string[] = []
  const ids = new Set<string>()
  if (!manifest.segments.length) return ['assembly manifest must contain at least one segment']
  let previousEnd = 0
  for (let index = 0; index < manifest.segments.length; index += 1) {
    const segment = manifest.segments[index]
    if (ids.has(segment.id)) errors.push(`duplicate assembly id: ${segment.id}`)
    ids.add(segment.id)
    if (!(segment.start >= 0 && segment.start < segment.end && segment.end <= 1)) {
      errors.push(`${segment.id}: start/end must satisfy 0 <= start < end <= 1`)
    }
    if (index === 0 && Math.abs(segment.start) > 1e-9) {
      errors.push(`${segment.id}: first segment must start at 0`)
    }
    if (index > 0 && Math.abs(segment.start - previousEnd) > 1e-9) {
      errors.push(`${segment.id}: segment ranges must be contiguous`)
    }
    if (!Number.isFinite(segment.explodeSignedFactor)) {
      errors.push(`${segment.id}: explodeSignedFactor must be finite`)
    }
    previousEnd = segment.end
  }
  if (Math.abs(previousEnd - 1) > 1e-9) errors.push('last segment must end at 1')
  return errors
}

export const normalizeAxisPosition = (value: number, min: number, max: number): number => {
  if (!(max > min)) throw new Error('axis bounds must have positive span')
  return Math.min(1, Math.max(0, (value - min) / (max - min)))
}

export const segmentForNormalizedPosition = (
  manifest: AssemblyManifest,
  position: number,
): AssemblySegment => {
  const t = Math.min(1, Math.max(0, position))
  const found = manifest.segments.find((segment, index) =>
    t >= segment.start && (t < segment.end || (index === manifest.segments.length - 1 && t <= segment.end)),
  )
  if (!found) throw new Error(`no assembly segment covers normalized position ${t}`)
  return found
}

export const axisComponentIndex = (axis: AssemblyAxis): 0 | 1 | 2 =>
  axis === 'x' ? 0 : axis === 'y' ? 1 : 2
