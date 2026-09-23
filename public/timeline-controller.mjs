import {
  advanceTimeline,
  canAdvanceTimeline,
  canRetreatTimeline,
  createTimelineState,
  pauseTimeline,
  playTimeline,
  restartTimeline,
  retreatTimeline,
  seekTimeline,
  setTimelineReducedMotion,
  stopTimeline,
  toggleTimelineDirection,
} from './core/timeline.js'
import { entityLabel, onLanguageChange, t } from './i18n.mjs'

export function createTimelineController({
  assemblyIds,
  assemblyLabels = new Map(),
  disabled = false,
  onTransition = () => {},
  onReducedMotionChange = () => {},
}) {
  const previousBtn = document.querySelector('#timelinePreviousBtn')
  const playBtn = document.querySelector('#timelinePlayBtn')
  const nextBtn = document.querySelector('#timelineNextBtn')
  const restartBtn = document.querySelector('#timelineRestartBtn')
  const directionBtn = document.querySelector('#timelineDirectionBtn')
  const slider = document.querySelector('#timelineSlider')
  const status = document.querySelector('#timelineStatus')
  const motionBadge = document.querySelector('#timelineMotionBadge')
  const controls = [previousBtn, playBtn, nextBtn, restartBtn, directionBtn, slider].filter(Boolean)
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
  let state = createTimelineState(assemblyIds, media?.matches === true)
  let isDisabled = disabled
  let timer = null

  if (slider) {
    slider.min = '0'
    slider.max = String(assemblyIds.length)
    slider.step = '1'
  }

  const labelFor = id => entityLabel(id, assemblyLabels.get(id) ?? id)
  const stepText = current => {
    const total = current.assemblyIds.length
    let base = t('timeline.initial')
    if (current.stepIndex === total) base = t('timeline.fullyExploded')
    else if (current.stepIndex > 0) base = t('timeline.step', { step: current.stepIndex, total })
    if (current.focusedAssemblyId) {
      base += ` · ${t('timeline.focus', { label: labelFor(current.focusedAssemblyId) })}`
    }
    return base
  }

  const clearTimer = () => {
    if (timer !== null) window.clearTimeout(timer)
    timer = null
  }

  const render = () => {
    const disabledNow = isDisabled
    const canAdvance = !disabledNow && canAdvanceTimeline(state)
    const canRetreat = !disabledNow && canRetreatTimeline(state)
    if (previousBtn) previousBtn.disabled = !canRetreat
    if (nextBtn) nextBtn.disabled = !canAdvance
    if (playBtn) {
      playBtn.disabled = !canAdvance
      playBtn.textContent = state.playback === 'playing' ? t('timeline.pause') : t('timeline.play')
      playBtn.setAttribute('aria-pressed', String(state.playback === 'playing'))
      playBtn.setAttribute('aria-label', state.playback === 'playing' ? t('timeline.pauseAria') : t('timeline.playAria'))
    }
    if (restartBtn) restartBtn.disabled = disabledNow || state.stepIndex === 0
    if (directionBtn) {
      directionBtn.disabled = disabledNow
      directionBtn.textContent = state.direction === 'forward' ? t('timeline.directionDisassemble') : t('timeline.directionAssemble')
      directionBtn.setAttribute('aria-pressed', String(state.direction === 'reverse'))
      directionBtn.setAttribute('aria-label', state.direction === 'forward' ? t('timeline.directionDisassembleAria') : t('timeline.directionAssembleAria'))
    }
    if (slider) {
      slider.disabled = disabledNow
      slider.value = String(state.stepIndex)
      slider.setAttribute('aria-valuetext', stepText(state))
    }
    if (status) status.textContent = disabledNow ? t('timeline.unavailable') : stepText(state)
    if (motionBadge) motionBadge.textContent = state.reducedMotion ? t('timeline.motionReduced') : t('timeline.motionStandard')
  }

  const schedulePlayback = () => {
    clearTimer()
    if (state.playback !== 'playing' || isDisabled) return
    if (!canAdvanceTimeline(state)) {
      state = stopTimeline(state)
      render()
      return
    }
    const dwell = state.reducedMotion ? 480 : 920
    timer = window.setTimeout(() => {
      const previous = state
      state = advanceTimeline(state)
      onTransition(previous, state, { reason: 'play' })
      if (!canAdvanceTimeline(state)) state = stopTimeline(state)
      render()
      schedulePlayback()
    }, dwell)
  }

  const transitionTo = (next, reason) => {
    clearTimer()
    const previous = state
    state = next
    onTransition(previous, state, { reason })
    render()
    schedulePlayback()
  }

  previousBtn?.addEventListener('click', () => transitionTo(retreatTimeline(state), 'previous'))
  nextBtn?.addEventListener('click', () => transitionTo(advanceTimeline(state), 'next'))
  restartBtn?.addEventListener('click', () => transitionTo(restartTimeline(state), 'restart'))
  directionBtn?.addEventListener('click', () => transitionTo(toggleTimelineDirection(state), 'direction'))
  playBtn?.addEventListener('click', () => {
    if (state.playback === 'playing') {
      state = pauseTimeline(state)
      clearTimer()
      render()
      return
    }
    state = playTimeline(state)
    render()
    schedulePlayback()
  })
  slider?.addEventListener('input', () => transitionTo(seekTimeline(state, Number(slider.value)), 'seek'))

  const onMediaChange = event => {
    const previous = state
    state = setTimelineReducedMotion(state, event.matches)
    onReducedMotionChange(previous, state)
    render()
  }
  media?.addEventListener?.('change', onMediaChange)
  const unsubscribeLanguage = onLanguageChange(() => render())

  const setDisabled = value => {
    isDisabled = Boolean(value)
    if (isDisabled) {
      state = stopTimeline(state)
      clearTimer()
    }
    controls.forEach(control => { if (control) control.disabled = isDisabled })
    render()
  }

  const resetSilently = () => {
    clearTimer()
    state = restartTimeline(state)
    render()
  }

  const destroy = () => {
    clearTimer()
    media?.removeEventListener?.('change', onMediaChange)
    unsubscribeLanguage()
  }

  render()
  return {
    getState: () => state,
    setDisabled,
    resetSilently,
    destroy,
  }
}
