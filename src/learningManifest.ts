import type { SectionAxis } from './section.js'

export type LearningViewMode = 'normal' | 'ghost' | 'xray'

export type LearningSectionPreset = {
  enabled: boolean
  axis: SectionAxis
  position: number
  inverted: boolean
  capped: boolean
}

export type LearningLessonDefinition = {
  id: string
  assemblyId: string
  titleKey: string
  bodyKey: string
  viewMode: LearningViewMode
  sectionPreset: LearningSectionPreset
}

export const rocketLearningLessons: readonly LearningLessonDefinition[] = [
  {
    id: 'base-assembly',
    assemblyId: 'base-assembly',
    titleKey: 'learning.lesson.base.title',
    bodyKey: 'learning.lesson.base.body',
    viewMode: 'normal',
    sectionPreset: { enabled: true, axis: 'y', position: 0.08, inverted: false, capped: true },
  },
  {
    id: 'lower-body-assembly',
    assemblyId: 'lower-body-assembly',
    titleKey: 'learning.lesson.lower.title',
    bodyKey: 'learning.lesson.lower.body',
    viewMode: 'normal',
    sectionPreset: { enabled: true, axis: 'y', position: 0.26, inverted: false, capped: true },
  },
  {
    id: 'center-body-assembly',
    assemblyId: 'center-body-assembly',
    titleKey: 'learning.lesson.center.title',
    bodyKey: 'learning.lesson.center.body',
    viewMode: 'ghost',
    sectionPreset: { enabled: true, axis: 'y', position: 0.50, inverted: false, capped: true },
  },
  {
    id: 'upper-body-assembly',
    assemblyId: 'upper-body-assembly',
    titleKey: 'learning.lesson.upper.title',
    bodyKey: 'learning.lesson.upper.body',
    viewMode: 'normal',
    sectionPreset: { enabled: true, axis: 'y', position: 0.74, inverted: false, capped: true },
  },
  {
    id: 'nose-stack-assembly',
    assemblyId: 'nose-stack-assembly',
    titleKey: 'learning.lesson.nose.title',
    bodyKey: 'learning.lesson.nose.body',
    viewMode: 'normal',
    sectionPreset: { enabled: true, axis: 'y', position: 0.94, inverted: false, capped: true },
  },
]

export const validateLearningManifest = (lessons: readonly LearningLessonDefinition[]): string[] => {
  const errors: string[] = []
  const lessonIds = new Set<string>()
  const assemblyIds = new Set<string>()
  for (const lesson of lessons) {
    if (!lesson.id.trim()) errors.push('learning lesson id must be non-empty')
    if (lessonIds.has(lesson.id)) errors.push(`duplicate learning lesson id: ${lesson.id}`)
    lessonIds.add(lesson.id)
    if (!lesson.assemblyId.trim()) errors.push(`${lesson.id}: assembly id must be non-empty`)
    if (assemblyIds.has(lesson.assemblyId)) errors.push(`duplicate learning assembly id: ${lesson.assemblyId}`)
    assemblyIds.add(lesson.assemblyId)
    if (!['x', 'y', 'z'].includes(lesson.sectionPreset.axis)) errors.push(`${lesson.id}: invalid section axis`)
    if (!Number.isFinite(lesson.sectionPreset.position) || lesson.sectionPreset.position < 0 || lesson.sectionPreset.position > 1) {
      errors.push(`${lesson.id}: section position must be within 0..1`)
    }
    if (!['normal', 'ghost', 'xray'].includes(lesson.viewMode)) errors.push(`${lesson.id}: invalid view mode`)
  }
  return errors
}
