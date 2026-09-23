import {
  createSectionState,
  resetSection,
  sectionAriaValueText,
  setSectionAxis,
  setSectionCapped,
  setSectionEnabled,
  setSectionPosition,
  toggleSectionInverted,
} from './core/section.js'

export function createSectionController({
  disabled = false,
  cappingSupported = true,
  onChange = () => {},
}) {
  const toggleBtn = document.querySelector('#sectionToggleBtn')
  const axisButtons = [...document.querySelectorAll('[data-section-axis]')]
  const invertBtn = document.querySelector('#sectionInvertBtn')
  const capBtn = document.querySelector('#sectionCapBtn')
  const slider = document.querySelector('#sectionSlider')
  const status = document.querySelector('#sectionStatus')
  const controls = [toggleBtn, invertBtn, capBtn, slider, ...axisButtons].filter(Boolean)
  let state = createSectionState()
  let isDisabled = Boolean(disabled)
  let capsAvailable = Boolean(cappingSupported)
  if (!capsAvailable) state = setSectionCapped(state, false)

  const statusText = () => {
    if (isDisabled) return 'Mặt cắt không khả dụng ở chế độ dự phòng'
    if (!state.enabled) return 'Mặt cắt đang tắt'
    const cap = state.capped && capsAvailable ? 'có nắp trực quan' : 'mặt cắt mở'
    const direction = state.inverted ? 'đảo hướng' : 'chuẩn'
    return `${state.axis.toUpperCase()} cut · ${Math.round(state.position * 100)}% · ${direction} · ${cap}`
  }

  const render = () => {
    const hardDisabled = isDisabled
    if (toggleBtn) {
      toggleBtn.disabled = hardDisabled
      toggleBtn.textContent = state.enabled ? 'Mặt cắt: Bật' : 'Mặt cắt: Tắt'
      toggleBtn.setAttribute('aria-pressed', String(state.enabled))
    }
    axisButtons.forEach(button => {
      button.disabled = hardDisabled || !state.enabled
      button.setAttribute('aria-pressed', String(button.dataset.sectionAxis === state.axis))
    })
    if (invertBtn) {
      invertBtn.disabled = hardDisabled || !state.enabled
      invertBtn.setAttribute('aria-pressed', String(state.inverted))
      invertBtn.textContent = state.inverted ? 'Hướng: Đảo' : 'Hướng: Chuẩn'
    }
    if (capBtn) {
      capBtn.disabled = hardDisabled || !state.enabled || !capsAvailable
      capBtn.setAttribute('aria-pressed', String(state.capped && capsAvailable))
      capBtn.textContent = capsAvailable
        ? (state.capped ? 'Nắp trực quan: Bật' : 'Nắp trực quan: Tắt')
        : 'Nắp trực quan: Không khả dụng'
    }
    if (slider) {
      slider.disabled = hardDisabled || !state.enabled
      slider.value = String(Math.round(state.position * 100))
      slider.setAttribute('aria-valuetext', sectionAriaValueText(state))
    }
    if (status) status.textContent = statusText()
  }

  const commit = (next, reason) => {
    const previous = state
    state = next
    onChange(previous, state, { reason })
    render()
  }

  toggleBtn?.addEventListener('click', () => commit(setSectionEnabled(state, !state.enabled), 'toggle'))
  axisButtons.forEach(button => button.addEventListener('click', () => {
    commit(setSectionAxis(state, button.dataset.sectionAxis), 'axis')
  }))
  invertBtn?.addEventListener('click', () => commit(toggleSectionInverted(state), 'invert'))
  capBtn?.addEventListener('click', () => commit(setSectionCapped(state, !state.capped), 'cap'))
  slider?.addEventListener('input', () => commit(setSectionPosition(state, Number(slider.value) / 100), 'position'))

  const setDisabled = value => {
    isDisabled = Boolean(value)
    render()
  }

  const setCappingSupported = value => {
    capsAvailable = Boolean(value)
    if (!capsAvailable && state.capped) state = setSectionCapped(state, false)
    render()
  }

  const resetSilently = () => {
    const previous = state
    state = resetSection()
    if (!capsAvailable) state = setSectionCapped(state, false)
    onChange(previous, state, { reason: 'reset' })
    render()
  }

  render()
  return {
    getState: () => state,
    setDisabled,
    setCappingSupported,
    resetSilently,
    destroy: () => {},
  }
}
