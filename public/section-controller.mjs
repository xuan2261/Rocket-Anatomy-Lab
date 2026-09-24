import {
  createSectionState,
  resetSection,
  setSectionAxis,
  setSectionCapped,
  setSectionEnabled,
  setSectionPosition,
  toggleSectionInverted,
} from './core/section.js'
import { onLanguageChange, t } from './i18n.mjs'

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
  let state = createSectionState()
  let isDisabled = Boolean(disabled)
  let capsAvailable = Boolean(cappingSupported)
  if (!capsAvailable) state = setSectionCapped(state, false)

  const directionKey = () => state.inverted ? 'section.inverted' : 'section.standard'
  const statusText = () => {
    if (isDisabled) return t('section.unavailable')
    if (!state.enabled) return t('section.offStatus')
    const cap = t(state.capped && capsAvailable ? 'section.visualCap' : 'section.open')
    return `${state.axis.toUpperCase()} · ${Math.round(state.position * 100)}% · ${t(directionKey())} · ${cap}`
  }

  const render = () => {
    const hardDisabled = isDisabled
    if (toggleBtn) {
      toggleBtn.disabled = hardDisabled
      toggleBtn.textContent = t(state.enabled ? 'section.toggleOn' : 'section.toggleOff')
      toggleBtn.setAttribute('aria-pressed', String(state.enabled))
    }
    axisButtons.forEach(button => {
      button.disabled = hardDisabled || !state.enabled
      button.setAttribute('aria-pressed', String(button.dataset.sectionAxis === state.axis))
    })
    if (invertBtn) {
      invertBtn.disabled = hardDisabled || !state.enabled
      invertBtn.setAttribute('aria-pressed', String(state.inverted))
      invertBtn.textContent = t(state.inverted ? 'section.directionInverted' : 'section.directionStandard')
    }
    if (capBtn) {
      capBtn.disabled = hardDisabled || !state.enabled || !capsAvailable
      capBtn.setAttribute('aria-pressed', String(state.capped && capsAvailable))
      capBtn.textContent = t(!capsAvailable ? 'section.capUnavailable' : state.capped ? 'section.capOn' : 'section.capOff')
    }
    if (slider) {
      slider.disabled = hardDisabled || !state.enabled
      slider.value = String(Math.round(state.position * 100))
      slider.setAttribute('aria-valuetext', t('section.sliderValue', {
        percent: Math.round(state.position * 100),
        axis: state.axis.toUpperCase(),
        direction: t(directionKey()),
      }))
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
  const unsubscribeLanguage = onLanguageChange(() => render())

  const applyPreset = preset => {
    if (isDisabled || !preset) return
    const previous = state
    let next = state
    next = setSectionEnabled(next, preset.enabled !== false)
    next = setSectionAxis(next, preset.axis ?? 'y')
    next = setSectionPosition(next, Number(preset.position ?? 0.5))
    const shouldInvert = Boolean(preset.inverted)
    if (next.inverted !== shouldInvert) next = toggleSectionInverted(next)
    next = setSectionCapped(next, capsAvailable && preset.capped !== false)
    state = next
    onChange(previous, state, { reason: 'preset' })
    render()
  }

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
    applyPreset,
    resetSilently,
    destroy: () => unsubscribeLanguage(),
  }
}
