import {
  anatomyChildren, anatomyNodeById, anatomyPath, anatomyText,
  saturnVAnatomyManifest, validateAnatomyManifest,
} from './core/anatomy.js'
import { getLanguage, onLanguageChange, t } from './i18n.mjs'

export function createAnatomyController({
  disabled = false,
  onFocusReference = () => {},
  onInspectReference = () => {},
} = {}) {
  const errors = validateAnatomyManifest(saturnVAnatomyManifest)
  if (errors.length) throw new Error(`Anatomy manifest invalid: ${errors.join('; ')}`)

  const modeButtons = [...document.querySelectorAll('[data-structure-mode]')]
  const modelPanel = document.querySelector('#modelStructurePanel')
  const anatomyPanel = document.querySelector('#anatomyPanel')
  const structureTitle = document.querySelector('#structureTitle')
  const showAllBtn = document.querySelector('#showAllBtn')
  const breadcrumb = document.querySelector('#anatomyBreadcrumbs')
  const list = document.querySelector('#anatomyList')
  const title = document.querySelector('#anatomyTitle')
  const description = document.querySelector('#anatomyDescription')
  const kind = document.querySelector('#anatomyKind')
  const binding = document.querySelector('#anatomyBinding')
  const backBtn = document.querySelector('#anatomyBackBtn')
  const focusBtn = document.querySelector('#anatomyFocusBtn')
  const inspectBtn = document.querySelector('#anatomyInspectBtn')
  const sourceLink = document.querySelector('#anatomySourceLink')

  let mode = 'model'
  let currentId = saturnVAnatomyManifest.rootId
  let isDisabled = Boolean(disabled)

  const current = () => anatomyNodeById(saturnVAnatomyManifest, currentId)
  const localized = value => anatomyText(value, getLanguage())

  const renderMode = () => {
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.structureMode === mode)))
    if (modelPanel) modelPanel.hidden = mode !== 'model'
    if (anatomyPanel) anatomyPanel.hidden = mode !== 'anatomy'
    if (showAllBtn) showAllBtn.hidden = mode !== 'model'
    if (structureTitle) {
      const key = mode === 'model' ? 'structure.title' : 'anatomy.title'
      structureTitle.dataset.i18n = key
      structureTitle.textContent = t(key)
    }
  }

  const renderBreadcrumb = item => {
    if (!breadcrumb) return
    breadcrumb.replaceChildren()
    for (const crumb of anatomyPath(saturnVAnatomyManifest, item.id)) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'anatomy-crumb'
      button.textContent = localized(crumb.label)
      if (crumb.id === item.id) button.setAttribute('aria-current', 'page')
      button.addEventListener('click', () => {
        currentId = crumb.id
        render()
        if (crumb.id !== saturnVAnatomyManifest.rootId) onFocusReference(crumb)
      })
      breadcrumb.append(button)
    }
  }

  const renderList = item => {
    if (!list) return
    list.replaceChildren()
    for (const child of anatomyChildren(saturnVAnatomyManifest, item.id)) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'anatomy-node'
      button.dataset.anatomyId = child.id

      const row = document.createElement('span')
      row.className = 'anatomy-node-heading'
      const strong = document.createElement('strong')
      strong.textContent = localized(child.label)
      const badge = document.createElement('span')
      badge.className = 'anatomy-kind-badge'
      badge.textContent = t(`anatomy.kind.${child.kind}`)
      row.append(strong, badge)

      const copy = document.createElement('span')
      copy.className = 'anatomy-node-copy'
      copy.textContent = localized(child.description)

      const childCount = anatomyChildren(saturnVAnatomyManifest, child.id).length
      const meta = document.createElement('span')
      meta.className = 'anatomy-node-meta'
      meta.textContent = childCount ? t('anatomy.childCount', { count: childCount }) : t('anatomy.referenceLeaf')

      button.append(row, copy, meta)
      button.addEventListener('click', () => {
        currentId = child.id
        render()
        onFocusReference(child)
      })
      list.append(button)
    }
  }

  const renderAnatomy = () => {
    const item = current()
    if (!item) return
    if (title) title.textContent = localized(item.label)
    if (description) description.textContent = localized(item.description)
    if (kind) kind.textContent = t(`anatomy.kind.${item.kind}`)
    if (binding) binding.textContent = t(item.binding === 'approximate-region' ? 'anatomy.bindingApproximate' : 'anatomy.bindingReference')
    if (backBtn) backBtn.disabled = !item.parentId
    const actionable = item.id !== saturnVAnatomyManifest.rootId && Boolean(item.focusAssemblyId)
    if (focusBtn) focusBtn.disabled = isDisabled || !actionable
    if (inspectBtn) inspectBtn.disabled = isDisabled || !actionable
    if (sourceLink) {
      sourceLink.href = item.sourceUrl
      sourceLink.textContent = t('anatomy.source', { source: item.sourceLabel })
    }
    renderBreadcrumb(item)
    renderList(item)
  }

  const render = () => { renderMode(); renderAnatomy() }

  modeButtons.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.structureMode === 'anatomy' ? 'anatomy' : 'model'
    render()
  }))
  backBtn?.addEventListener('click', () => {
    const item = current()
    if (!item?.parentId) return
    currentId = item.parentId
    render()
    const parent = current()
    if (parent && parent.id !== saturnVAnatomyManifest.rootId) onFocusReference(parent)
  })
  focusBtn?.addEventListener('click', () => {
    const item = current()
    if (!isDisabled && item) onFocusReference(item)
  })
  inspectBtn?.addEventListener('click', () => {
    const item = current()
    if (!isDisabled && item) onInspectReference(item)
  })

  const unsubscribeLanguage = onLanguageChange(() => render())
  render()
  return {
    getMode: () => mode,
    getCurrentId: () => currentId,
    setDisabled: value => { isDisabled = Boolean(value); render() },
    destroy: () => unsubscribeLanguage(),
  }
}
