export type Vec3 = readonly [number, number, number]

export type PartDefinition = {
  id: string
  label: string
  description: string
  geometry: {
    kind: 'cone' | 'frustum' | 'cylinder'
    height: number
    radiusBottom: number
    radiusTop: number
    baseY: number
  }
  explode: {
    axis: Vec3
    distance: number
  }
}

export type ModelManifest = {
  id: string
  label: string
  sourceLabel: string
  educationalOnly: true
  parts: PartDefinition[]
}

export type ViewerMode = 'normal' | 'ghost' | 'xray'

export type ViewerState = {
  selectedId: string | null
  hiddenIds: ReadonlySet<string>
  isolatedId: string | null
  mode: ViewerMode
  explode: number
}

export type PartViewState = {
  id: string
  visible: boolean
  selected: boolean
  opacity: number
  offset: Vec3
}
