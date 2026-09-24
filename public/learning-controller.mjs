import {
  createLearningState,
  currentLearningLessonId,
  learningProgress,
  learningSearch,
  lessonIdFromSearch,
  nextLearningLesson,
  previousLearningLesson,
  selectLearningLesson,
} from './core/learning.js'
import { rocketLearningLessons, validateLearningManifest } from './core/learningManifest.js'
import { entityLabel, getLanguage, onLanguageChange, t } from './i18n.mjs'

export function createLearningController({
  disabled = false,
  onSelectAssembly = () => {},
  onFocusAssembly = () => {},
  onApplyView = () => {},
  getAnnotationAnchor = () => null,
}) {
  const manifestErrors = validateLearningManifest(rocketLearningLessons)
  if (manifestErrors.length) throw new Error(`Learning manifest invalid: ${manifestErrors.join('; ')}`)

  const lessonIds = rocketLearningLessons.map(lesson => lesson.id)
  const deepLinkedLesson = lessonIdFromSearch(location.search, lessonIds)
  let state = createLearningState(lessonIds, deepLinkedLesson)
  let isDisabled = Boolean(disabled)
  let annotationsVisible = false
  let expanded = true
  let copyTimer = null

  const lessonById = new Map(rocketLearningLessons.map(lesson => [lesson.id, lesson]))
  const toggleBtn = document.querySelector('#learningToggleBtn')
  const body = document.querySelector('#learningPanelBody')
  const title = document.querySelector('#learningTitle')
  const description = document.querySelector('#learningDescription')
  const progress = document.querySelector('#learningProgress')
  const previousBtn = document.querySelector('#learningPreviousBtn')
  const nextBtn = document.querySelector('#learningNextBtn')
  const focusBtn = document.querySelector('#learningFocusBtn')
  const applyBtn = document.querySelector('#learningApplyViewBtn')
  const copyBtn = document.querySelector('#learningCopyLinkBtn')
  const annotationBtn = document.querySelector('#learningAnnotationsBtn')
  const shareStatus = document.querySelector('#learningShareStatus')
  const annotationLayer = document.querySelector('#annotationLayer')

  const markerById = new Map()

  const lesson = () => lessonById.get(currentLearningLessonId(state))

  const syncUrl = () => {
    try {
      const url = new URL(location.href)
      url.search = learningSearch(url.search, currentLearningLessonId(state), lessonIds, getLanguage())
      history.replaceState(history.state, '', url)
    } catch {}
  }

  const renderMarkers = () => {
    if (!annotationLayer) return
    annotationLayer.replaceChildren()
    markerById.clear()
    const item = lesson()
    if (item) {
      const marker = document.createElement('button')
      marker.type = 'button'
      marker.className = 'annotation-marker'
      marker.dataset.annotationId = item.assemblyId
      marker.setAttribute('aria-label', t('learning.annotationAria', { label: entityLabel(item.assemblyId, item.assemblyId) }))
      marker.textContent = entityLabel(item.assemblyId, item.assemblyId)
      marker.addEventListener('click', () => activateLesson(item.id, { focus: true }))
      markerById.set(item.assemblyId, marker)
      annotationLayer.append(marker)
    }
    annotationLayer.hidden = isDisabled || !annotationsVisible || !item
  }

  const render = () => {
    const current = lesson()
    const p = learningProgress(state)
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(expanded))
      toggleBtn.textContent = t('learning.toggle')
    }
    if (body) body.hidden = !expanded
    if (title) title.textContent = current ? t(current.titleKey) : t('learning.unavailable')
    if (description) description.textContent = current ? t(current.bodyKey) : ''
    if (progress) progress.textContent = t('learning.progress', { current: p.current, total: p.total })
    if (previousBtn) previousBtn.disabled = isDisabled || state.currentIndex === 0
    if (nextBtn) nextBtn.disabled = isDisabled || state.currentIndex === lessonIds.length - 1
    for (const control of [focusBtn, applyBtn, copyBtn, annotationBtn]) if (control) control.disabled = isDisabled
    if (annotationBtn) {
      annotationBtn.setAttribute('aria-pressed', String(annotationsVisible))
      annotationBtn.textContent = t(annotationsVisible ? 'learning.annotationsOn' : 'learning.annotationsOff')
    }
    if (isDisabled) {
      if (title) title.textContent = t('learning.unavailable')
      if (description) description.textContent = t('learning.unavailableDescription')
    }
    renderMarkers()
    syncUrl()
  }

  function activateLesson(lessonId, { focus = false } = {}) {
    if (isDisabled) return
    state = selectLearningLesson(state, lessonId)
    const current = lesson()
    if (current) {
      onSelectAssembly(current.assemblyId)
      if (focus) onFocusAssembly(current.assemblyId)
    }
    render()
  }

  previousBtn?.addEventListener('click', () => {
    if (isDisabled) return
    state = previousLearningLesson(state)
    activateLesson(currentLearningLessonId(state), { focus: true })
  })
  nextBtn?.addEventListener('click', () => {
    if (isDisabled) return
    state = nextLearningLesson(state)
    activateLesson(currentLearningLessonId(state), { focus: true })
  })
  focusBtn?.addEventListener('click', () => {
    const current = lesson()
    if (!isDisabled && current) {
      onSelectAssembly(current.assemblyId)
      onFocusAssembly(current.assemblyId)
    }
  })
  applyBtn?.addEventListener('click', () => {
    const current = lesson()
    if (!isDisabled && current) {
      onSelectAssembly(current.assemblyId)
      onFocusAssembly(current.assemblyId)
      onApplyView(current)
    }
  })
  annotationBtn?.addEventListener('click', () => {
    annotationsVisible = !annotationsVisible
    render()
  })
  toggleBtn?.addEventListener('click', () => {
    expanded = !expanded
    render()
  })
  copyBtn?.addEventListener('click', async () => {
    if (isDisabled) return
    syncUrl()
    try {
      await navigator.clipboard.writeText(location.href)
      if (shareStatus) shareStatus.textContent = t('learning.copied')
    } catch {
      if (shareStatus) shareStatus.textContent = t('learning.copyFailed')
    }
    if (copyTimer !== null) window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => { if (shareStatus) shareStatus.textContent = '' }, 2200)
  })

  const updateAnnotations = () => {
    if (isDisabled || !annotationsVisible || !annotationLayer) return
    for (const [assemblyId, marker] of markerById) {
      const anchor = getAnnotationAnchor(assemblyId)
      if (!anchor || anchor.visible === false || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
        marker.hidden = true
        continue
      }
      marker.hidden = false
      marker.style.transform = `translate3d(${anchor.x}px, ${anchor.y}px, 0) translate(-50%, -50%)`
    }
  }

  const setDisabled = value => {
    isDisabled = Boolean(value)
    render()
  }

  const unsubscribeLanguage = onLanguageChange(() => render())

  render()
  if (deepLinkedLesson && !isDisabled) {
    const current = lesson()
    if (current) {
      onSelectAssembly(current.assemblyId)
      onFocusAssembly(current.assemblyId)
    }
  }

  return {
    getState: () => state,
    setDisabled,
    updateAnnotations,
    destroy: () => {
      unsubscribeLanguage()
      if (copyTimer !== null) window.clearTimeout(copyTimer)
      annotationLayer?.replaceChildren()
    },
  }
}
