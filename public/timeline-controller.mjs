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

  const labelFor = id => assemblyLabels.get(id) ?? id
  const stepText = current => {
    const total = current.assemblyIds.length
    const focus = current.focusedAssemblyId ? ` · Trọng tâm: ${labelFor(current.focusedAssemblyId)}` : ''
    if (current.stepIndex === 0) return `Trạng thái lắp ghép ban đầu${focus}`
    if (current.stepIndex === total) return `Đã tách toàn bộ các cụm số hóa${focus}`
    return `Bước ${current.stepIndex}/${total}${focus}`
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
      playBtn.textContent = state.playback === 'playing' ? 'Tạm dừng' : 'Phát'
      playBtn.setAttribute('aria-pressed', String(state.playback === 'playing'))
      playBtn.setAttribute('aria-label', state.playback === 'playing' ? 'Tạm dừng trình bày có hướng dẫn' : 'Phát trình bày có hướng dẫn')
    }
    if (restartBtn) restartBtn.disabled = disabledNow || state.stepIndex === 0
    if (directionBtn) {
      directionBtn.disabled = disabledNow
      directionBtn.textContent = state.direction === 'forward' ? 'Hướng: Tháo rời' : 'Hướng: Lắp lại'
      directionBtn.setAttribute('aria-pressed', String(state.direction === 'reverse'))
      directionBtn.setAttribute('aria-label', state.direction === 'forward' ? 'Hướng trình bày: tháo rời' : 'Hướng trình bày: lắp lại')
    }
    if (slider) {
      slider.disabled = disabledNow
      slider.value = String(state.stepIndex)
      slider.setAttribute('aria-valuetext', stepText(state))
    }
    if (status) status.textContent = disabledNow ? 'Dòng thời gian không khả dụng ở chế độ chỉ quan sát' : stepText(state)
    if (motionBadge) motionBadge.textContent = state.reducedMotion ? 'Chuyển động: giảm' : 'Chuyển động: tiêu chuẩn'
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
  }

  render()
  return {
    getState: () => state,
    setDisabled,
    resetSilently,
    destroy,
  }
}
