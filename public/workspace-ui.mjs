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
    helpKicker: 'HƯỚNG DẪN',
    helpTitle: 'Bắt đầu nhanh với Rocket Anatomy Lab',
    helpIntro: 'Đi theo 5 bước dưới đây để chọn cụm, quan sát, tách mô hình, dùng bài học và khám phá giải phẫu NASA.',
    helpStep1Title: '1. Xoay, thu phóng và chọn',
    helpStep1Body: 'Kéo trên mô hình để xoay, lăn chuột hoặc chụm hai ngón để thu phóng. Bấm trực tiếp lên tên lửa hoặc chọn một cụm trong tab Đối tượng.',
    helpStep2Title: '2. Ẩn, hiện và cô lập',
    helpStep2Body: 'Trong tab Đối tượng, dùng ô chọn để ẩn/hiện từng cụm; dùng Cô lập để chỉ giữ cụm đang học và Hiện tất cả để khôi phục.',
    helpStep3Title: '3. Đổi chế độ quan sát',
    helpStep3Body: 'Tab Góc nhìn có Bình thường, Bóng mờ và X-quang, cùng thanh Tách cụm. Bình thường giữ các cụm còn lại hoàn toàn đục.',
    helpStep4Title: '4. Học theo trình tự',
    helpStep4Body: 'Tab Trình bày cho phép tháo/lắp theo bước; tab Bài học có 5 bài semantic, camera focus, chú thích và liên kết sâu có thể chia sẻ.',
    helpStep5Title: '5. Mặt cắt và giải phẫu NASA',
    helpStep5Body: 'Dùng tab Mặt cắt để quan sát bên trong; trong Đối tượng → Giải phẫu NASA, mở cây tham chiếu nhiều cấp và nguồn bằng chứng.',
    helpKeyboardTitle: 'Bàn phím',
    helpKeyboardBody: 'Khi focus ở hàng tab, dùng ←/→ để chuyển tab, Home/End để về đầu/cuối. Tab tiếp tục đi vào nội dung panel đang mở.',
    helpEvidenceTitle: 'Phạm vi giáo dục',
    helpEvidenceBody: 'Các cụm là vùng hình học phục vụ học tập; không phải ranh giới tầng lịch sử hay hướng dẫn lắp ráp ngoài đời thực.',
    helpDocsLink: 'Mở hướng dẫn đầy đủ trên GitHub ↗',
    tabs: {
      objects: 'Đối tượng',
      view: 'Góc nhìn',
      timeline: 'Trình bày',
      learning: 'Bài học',
      section: 'Mặt cắt',
      help: 'Hướng dẫn',
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
    helpKicker: 'GUIDE',
    helpTitle: 'Quick start with Rocket Anatomy Lab',
    helpIntro: 'Follow these 5 steps to select assemblies, inspect the model, separate geometry, use lessons, and explore NASA reference anatomy.',
    helpStep1Title: '1. Orbit, zoom, and select',
    helpStep1Body: 'Drag the model to orbit, use the mouse wheel or pinch gesture to zoom. Click the rocket directly or choose an assembly in the Objects tab.',
    helpStep2Title: '2. Hide, show, and isolate',
    helpStep2Body: 'In Objects, use the checkboxes to hide/show assemblies; use Isolate to keep only the current assembly and Show all to restore context.',
    helpStep3Title: '3. Change inspection mode',
    helpStep3Body: 'View offers Normal, Ghost, and X-ray plus the Explode slider. Normal keeps all other visible assemblies fully opaque.',
    helpStep4Title: '4. Learn in sequence',
    helpStep4Body: 'Presentation steps through disassembly/reassembly; Learning provides 5 semantic lessons, camera focus, annotations, and shareable deep links.',
    helpStep5Title: '5. Section and NASA anatomy',
    helpStep5Body: 'Use Section to inspect the interior; in Objects → NASA Anatomy, open the multi-level reference tree and evidence sources.',
    helpKeyboardTitle: 'Keyboard',
    helpKeyboardBody: 'When the tab row has focus, use ←/→ to move, Home/End to jump to the first/last tab. Tab then moves into the active panel.',
    helpEvidenceTitle: 'Educational scope',
    helpEvidenceBody: 'Assemblies are display-oriented learning regions, not historical stage boundaries or real-world assembly instructions.',
    helpDocsLink: 'Open the full guide on GitHub ↗',
    tabs: {
      objects: 'Objects',
      view: 'View',
      timeline: 'Presentation',
      learning: 'Learning',
      section: 'Section',
      help: 'Guide',
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
