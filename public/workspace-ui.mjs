import { getLanguage, onLanguageChange } from './i18n.mjs'

const THEME_KEY = 'rocket-anatomy-theme'
const THEMES = new Set(['light', 'dark'])
const DEFAULT_TAB = 'objects'

const labels = {
  vi: {
    skipToViewer: 'Bỏ qua đến trình xem 3D',
    themeGroup: 'Giao diện',
    themeLight: 'Sáng',
    themeDark: 'Tối',
    controlCenterAria: 'Trung tâm điều khiển',
    controlKicker: 'ĐIỀU KHIỂN',
    tablistAria: 'Nhóm điều khiển',
    sourceDebug: 'Nguồn & gỡ lỗi',
    viewKicker: 'GÓC NHÌN',
    viewTitle: 'Quan sát mô hình',
    viewDescription: 'Đổi chế độ hiển thị, mức tách cụm và đặt lại góc nhìn tại cùng một vị trí.',
    tabs: {
      objects: 'Đối tượng',
      view: 'Góc nhìn',
      timeline: 'Trình bày',
      learning: 'Bài học',
      section: 'Mặt cắt',
    },
  },
  en: {
    skipToViewer: 'Skip to 3D viewer',
    themeGroup: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    controlCenterAria: 'Control center',
    controlKicker: 'CONTROLS',
    tablistAria: 'Control groups',
    sourceDebug: 'Source & debug',
    viewKicker: 'VIEW',
    viewTitle: 'Model view',
    viewDescription: 'Change display mode, assembly separation and camera reset from one place.',
    tabs: {
      objects: 'Objects',
      view: 'View',
      timeline: 'Presentation',
      learning: 'Learning',
      section: 'Section',
    },
  },
}

function languagePack() {
  return labels[getLanguage()] ?? labels.vi
}

function preferredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (THEMES.has(stored)) return stored
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setTheme(theme, { persist = true } = {}) {
  const next = THEMES.has(theme) ? theme : preferredTheme()
  document.documentElement.dataset.theme = next
  document.documentElement.style.colorScheme = next

  document.querySelectorAll('[data-theme-value]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeValue === next))
  })

  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', next === 'dark' ? '#0a0f16' : '#f6f8fb')

  if (persist) {
    try { localStorage.setItem(THEME_KEY, next) } catch {}
  }

  window.dispatchEvent(new CustomEvent('rocket-anatomy:themechange', {
    detail: { theme: next },
  }))
  return next
}

function renderWorkspaceLabels() {
  const pack = languagePack()

  document.querySelectorAll('[data-workspace-label]').forEach(node => {
    const key = node.dataset.workspaceLabel
    if (pack[key]) node.textContent = pack[key]
  })

  document.querySelectorAll('[data-workspace-aria]').forEach(node => {
    const key = node.dataset.workspaceAria
    if (pack[key]) node.setAttribute('aria-label', pack[key])
  })

  document.querySelectorAll('[data-workspace-tab-label]').forEach(node => {
    const tab = node.dataset.workspaceTabLabel
    if (pack.tabs[tab]) node.textContent = pack.tabs[tab]
  })

  const selected = document.querySelector('[data-control-tab][aria-selected="true"]')
  const title = document.querySelector('#controlCenterTitle')
  if (selected && title) title.textContent = pack.tabs[selected.dataset.controlTab] ?? selected.textContent
}

export function activateControlTab(name = DEFAULT_TAB, { focus = false } = {}) {
  const tabs = [...document.querySelectorAll('[data-control-tab]')]
  const panes = [...document.querySelectorAll('[data-control-pane]')]
  const requested = tabs.find(tab => tab.dataset.controlTab === name)
  const activeTab = requested ?? tabs.find(tab => tab.dataset.controlTab === DEFAULT_TAB) ?? tabs[0]
  if (!activeTab) return null

  const activeName = activeTab.dataset.controlTab
  tabs.forEach(tab => {
    const selected = tab === activeTab
    tab.setAttribute('aria-selected', String(selected))
    tab.tabIndex = selected ? 0 : -1
  })
  panes.forEach(pane => {
    pane.hidden = pane.dataset.controlPane !== activeName
  })

  const title = document.querySelector('#controlCenterTitle')
  const pack = languagePack()
  if (title) title.textContent = pack.tabs[activeName] ?? activeTab.textContent
  if (focus) activeTab.focus()
  return activeName
}

function bindTabs() {
  const tabs = [...document.querySelectorAll('[data-control-tab]')]
  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateControlTab(tab.dataset.controlTab))
    tab.addEventListener('keydown', event => {
      const index = tabs.indexOf(tab)
      let nextIndex = null
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
      if (event.key === 'Home') nextIndex = 0
      if (event.key === 'End') nextIndex = tabs.length - 1
      if (nextIndex === null) return
      event.preventDefault()
      activateControlTab(tabs[nextIndex].dataset.controlTab, { focus: true })
    })
  })
}

function bindTheme() {
  document.querySelectorAll('[data-theme-value]').forEach(button => {
    button.addEventListener('click', () => setTheme(button.dataset.themeValue))
  })

  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  media?.addEventListener?.('change', event => {
    try {
      if (THEMES.has(localStorage.getItem(THEME_KEY))) return
    } catch {}
    setTheme(event.matches ? 'dark' : 'light', { persist: false })
  })
}

export function initializeWorkspaceUi() {
  setTheme(preferredTheme(), { persist: false })
  bindTheme()
  bindTabs()
  activateControlTab(DEFAULT_TAB)
  renderWorkspaceLabels()
  return onLanguageChange(() => renderWorkspaceLabels())
}
