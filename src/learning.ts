export type LearningState = {
  lessonIds: readonly string[]
  currentIndex: number
}

export const validateLearningLessonIds = (lessonIds: readonly string[]): string[] => {
  const errors: string[] = []
  if (!lessonIds.length) return ['learning requires at least one lesson id']
  const seen = new Set<string>()
  for (const id of lessonIds) {
    if (!id.trim()) errors.push('learning lesson ids must be non-empty')
    if (seen.has(id)) errors.push(`duplicate learning lesson id: ${id}`)
    seen.add(id)
  }
  return errors
}

export const createLearningState = (
  lessonIds: readonly string[],
  initialLessonId?: string | null,
): LearningState => {
  const errors = validateLearningLessonIds(lessonIds)
  if (errors.length) throw new Error(errors.join('; '))
  const initialIndex = initialLessonId ? lessonIds.indexOf(initialLessonId) : 0
  return {
    lessonIds: [...lessonIds],
    currentIndex: initialIndex >= 0 ? initialIndex : 0,
  }
}

export const currentLearningLessonId = (state: LearningState): string =>
  state.lessonIds[state.currentIndex]

export const selectLearningLesson = (state: LearningState, lessonId: string): LearningState => {
  const index = state.lessonIds.indexOf(lessonId)
  if (index < 0) throw new Error(`unknown learning lesson id: ${lessonId}`)
  return { ...state, currentIndex: index }
}

export const nextLearningLesson = (state: LearningState): LearningState => ({
  ...state,
  currentIndex: Math.min(state.lessonIds.length - 1, state.currentIndex + 1),
})

export const previousLearningLesson = (state: LearningState): LearningState => ({
  ...state,
  currentIndex: Math.max(0, state.currentIndex - 1),
})

export const learningProgress = (state: LearningState): { current: number; total: number } => ({
  current: state.currentIndex + 1,
  total: state.lessonIds.length,
})

export const lessonIdFromSearch = (search: string, validLessonIds: readonly string[]): string | null => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const lessonId = params.get('lesson')
  return lessonId && validLessonIds.includes(lessonId) ? lessonId : null
}

export const learningSearch = (
  search: string,
  lessonId: string,
  validLessonIds: readonly string[],
  language?: string | null,
): string => {
  if (!validLessonIds.includes(lessonId)) throw new Error(`unknown learning lesson id: ${lessonId}`)
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  params.set('lesson', lessonId)
  if (language === 'vi' || language === 'en') params.set('lang', language)
  return `?${params.toString()}`
}
