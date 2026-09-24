import {
  anatomyChildren,
  anatomyNodeById,
  anatomyPath,
  anatomyText,
  saturnVAnatomyManifest,
  validateAnatomyManifest,
} from './core/anatomy.js'
import {
  anatomyNodeIdFromSearch,
  anatomySearch,
  filterAnatomyNodes,
  structureModeFromSearch,
} from './core/anatomyNavigation.js'
import { detailAssetForNode } from './core/detailAssets.js'
import { getLanguage, onLanguageChange, t } from './i18n.mjs'

export function createAnatomyController({
  disabled = false,
  onFocusReference = () => {},
  onInspectReference = () => {},
  onLoadRealDetail = async () => false,
  onSetRealDetailExplode = async () => false,
  onSetRealDetailPartVisible = async () => false,
  getReferenceAnchor = () => null,
} = {}) {
  const errors = validateAnatomyManifest(saturnVAnatomyManifest)
  if (errors.length) throw new Error(`Anatomy manifest invalid: ${errors.join('; ')}`)

  const nodeIds = saturnVAnatomyManifest.nodes.map(node => node.id)
  const deepLinkedId = anatomyNodeIdFromSearch(location.search, nodeIds)

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
  const searchInput = document.querySelector('#anatomySearchInput')
  const searchStatus = document.querySelector('#anatomySearchStatus')
  const evidenceSource = document.querySelector('#anatomyEvidenceSource')
  const evidenceMapping = document.querySelector('#anatomyEvidenceMapping')
  const copyBtn = document.querySelector('#anatomyCopyLinkBtn')
  const shareStatus = document.querySelector('#anatomyShareStatus')
  const referenceLayer = document.querySelector('#anatomyReferenceLayer')
  const realDetailCard = document.querySelector('#anatomyRealDetailCard')
  const realDetailTitle = document.querySelector('#anatomyRealDetailTitle')
  const realDetailBtn = document.querySelector('#anatomyLoadRealDetailBtn')
  const realDetailStatus = document.querySelector('#anatomyRealDetailStatus')
  const realDetailPartsWrap = document.querySelector('#anatomyRealDetailPartsWrap')
  const realDetailPartsList = document.querySelector('#anatomyRealDetailPartsList')
  const realDetailExplodeSlider = document.querySelector('#anatomyRealDetailExplodeSlider')

  let mode = structureModeFromSearch(location.search, nodeIds)
  let currentId = deepLinkedId ?? saturnVAnatomyManifest.rootId
  let isDisabled = Boolean(disabled)
  let searchQuery = ''
  let copyTimer = null
  let detailLoadingNodeId = null
  const loadedDetailNodes = new Set()
  const failedDetailNodes = new Set()
  const detailExplodeByNode = new Map()
  const detailPartVisibilityByNode = new Map()

  const current = () => anatomyNodeById(saturnVAnatomyManifest, currentId)
  const localized = value => anatomyText(value, getLanguage())

  const syncUrl = ({ push = false } = {}) => {
    try {
      const url = new URL(location.href)
      url.search = anatomySearch(url.search, currentId, nodeIds, mode, getLanguage())
      if (url.href === location.href) return
      const method = push ? 'pushState' : 'replaceState'
      history[method](history.state, '', url)
    } catch {}
  }

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
      button.addEventListener('click', () => navigateTo(crumb.id, { push: true, focus: crumb.id !== saturnVAnatomyManifest.rootId }))
      breadcrumb.append(button)
    }
  }

  const createNodeButton = item => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'anatomy-node'
    button.dataset.anatomyId = item.id

    const row = document.createElement('span')
    row.className = 'anatomy-node-heading'
    const strong = document.createElement('strong')
    strong.textContent = localized(item.label)
    const badge = document.createElement('span')
    badge.className = 'anatomy-kind-badge'
    badge.textContent = t(`anatomy.kind.${item.kind}`)
    row.append(strong, badge)

    const copy = document.createElement('span')
    copy.className = 'anatomy-node-copy'
    copy.textContent = localized(item.description)

    const childCount = anatomyChildren(saturnVAnatomyManifest, item.id).length
    const meta = document.createElement('span')
    meta.className = 'anatomy-node-meta'
    meta.textContent = childCount ? t('anatomy.childCount', { count: childCount }) : t('anatomy.referenceLeaf')

    button.append(row, copy, meta)
    button.addEventListener('click', () => navigateTo(item.id, { push: true, focus: true }))
    return button
  }

  const renderList = item => {
    if (!list) return
    list.replaceChildren()
    const results = searchQuery
      ? filterAnatomyNodes(saturnVAnatomyManifest, searchQuery, getLanguage())
      : anatomyChildren(saturnVAnatomyManifest, item.id)

    for (const child of results) list.append(createNodeButton(child))

    if (searchStatus) {
      searchStatus.textContent = searchQuery
        ? t(results.length ? 'anatomy.searchCount' : 'anatomy.searchEmpty', { count: results.length })
        : ''
    }
  }

  const renderReferenceMarker = item => {
    if (!referenceLayer) return
    referenceLayer.replaceChildren()
    const visible = mode === 'anatomy' && !isDisabled && item.id !== saturnVAnatomyManifest.rootId && Boolean(item.focusAssemblyId)
    referenceLayer.hidden = !visible
    if (!visible) return

    const marker = document.createElement('button')
    marker.type = 'button'
    marker.className = 'anatomy-reference-marker'
    marker.dataset.anatomyReferenceId = item.id
    marker.textContent = localized(item.label)
    marker.setAttribute('aria-label', `${localized(item.label)} · ${t('anatomy.bindingApproximate')}`)
    marker.addEventListener('click', () => onFocusReference(item))
    referenceLayer.append(marker)
  }

  const renderAnatomy = () => {
    const item = current()
    if (!item) return
    if (searchInput) searchInput.placeholder = t('anatomy.searchPlaceholder')
    if (title) title.textContent = localized(item.label)
    if (description) description.textContent = localized(item.description)
    if (kind) kind.textContent = t(`anatomy.kind.${item.kind}`)
    const mappingText = t(item.binding === 'approximate-region' ? 'anatomy.bindingApproximate' : 'anatomy.bindingReference')
    if (binding) binding.textContent = mappingText
    if (evidenceSource) evidenceSource.textContent = t('anatomy.evidenceOfficial')
    if (evidenceMapping) evidenceMapping.textContent = mappingText
    if (backBtn) backBtn.disabled = !item.parentId
    const actionable = item.id !== saturnVAnatomyManifest.rootId && Boolean(item.focusAssemblyId)
    if (focusBtn) focusBtn.disabled = isDisabled || !actionable
    if (inspectBtn) inspectBtn.disabled = isDisabled || !actionable
    if (copyBtn) copyBtn.disabled = false
    if (sourceLink) {
      sourceLink.href = item.sourceUrl
      sourceLink.textContent = t('anatomy.source', { source: item.sourceLabel })
    }

    const realDetail = detailAssetForNode(item.id)
    const detailAvailable = !isDisabled && Boolean(realDetail)
    if (realDetailCard) realDetailCard.hidden = !detailAvailable
    if (realDetailTitle && realDetail) realDetailTitle.textContent = localized(realDetail.label)
    if (realDetailBtn) {
      const loading = detailLoadingNodeId === item.id
      realDetailBtn.disabled = !detailAvailable || loading
      realDetailBtn.textContent = t(loadedDetailNodes.has(item.id) ? 'anatomy.realDetailShow' : 'anatomy.realDetailLoad')
    }
    const multiPartDetail = realDetail?.sourceKind === 'generated-stl-package'
    const detailLoaded = loadedDetailNodes.has(item.id)
    if (realDetailPartsWrap) realDetailPartsWrap.hidden = !detailAvailable || !multiPartDetail
    if (realDetailExplodeSlider) {
      realDetailExplodeSlider.disabled = !detailAvailable || !multiPartDetail || !detailLoaded
      realDetailExplodeSlider.value = String(Math.round((detailExplodeByNode.get(item.id) ?? 0) * 100))
    }
    if (realDetailPartsList) {
      realDetailPartsList.replaceChildren()
      if (multiPartDetail) {
        let visibility = detailPartVisibilityByNode.get(item.id)
        if (!visibility) {
          visibility = new Map(realDetail.sourceParts.map(part => [part.id, true]))
          detailPartVisibilityByNode.set(item.id, visibility)
        }
        for (const part of realDetail.sourceParts) {
          const visible = visibility.get(part.id) !== false
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'real-detail-part-button'
          button.dataset.realDetailPartId = part.id
          button.setAttribute('aria-pressed', String(visible))
          button.setAttribute('aria-label', t(visible ? 'anatomy.realDetailPartVisible' : 'anatomy.realDetailPartHidden', { name: part.fileName }))
          button.textContent = part.fileName
          button.disabled = !detailLoaded
          button.addEventListener('click', async () => {
            const nextVisible = button.getAttribute('aria-pressed') !== 'true'
            const applied = await onSetRealDetailPartVisible(item, part.id, nextVisible)
            if (applied === false) return
            visibility.set(part.id, nextVisible)
            renderAnatomy()
          })
          realDetailPartsList.append(button)
        }
      }
    }
    if (realDetailStatus) {
      const suffix = realDetail?.partCount > 1 ? ` · ${t('anatomy.realDetailParts', { count: realDetail.partCount })}` : ''
      if (!detailAvailable) realDetailStatus.textContent = ''
      else if (detailLoadingNodeId === item.id) realDetailStatus.textContent = t('anatomy.realDetailLoading') + suffix
      else if (failedDetailNodes.has(item.id)) realDetailStatus.textContent = t('anatomy.realDetailFailed')
      else if (detailLoaded) realDetailStatus.textContent = t('anatomy.realDetailLoaded') + suffix
      else realDetailStatus.textContent = t('anatomy.realDetailReady') + suffix
    }

    renderBreadcrumb(item)
    renderList(item)
    renderReferenceMarker(item)
  }

  const render = () => {
    renderMode()
    renderAnatomy()
  }

  function navigateTo(nodeId, { push = false, focus = false } = {}) {
    const item = anatomyNodeById(saturnVAnatomyManifest, nodeId)
    if (!item) return
    currentId = item.id
    mode = 'anatomy'
    searchQuery = ''
    if (searchInput) searchInput.value = ''
    render()
    syncUrl({ push })
    if (focus && !isDisabled && item.focusAssemblyId) onFocusReference(item)
  }

  const setMode = (next, { push = false } = {}) => {
    mode = next === 'anatomy' ? 'anatomy' : 'model'
    render()
    syncUrl({ push })
  }

  modeButtons.forEach(button => button.addEventListener('click', () => {
    setMode(button.dataset.structureMode, { push: true })
  }))

  backBtn?.addEventListener('click', () => {
    const item = current()
    if (!item?.parentId) return
    navigateTo(item.parentId, { push: true, focus: item.parentId !== saturnVAnatomyManifest.rootId })
  })

  focusBtn?.addEventListener('click', () => {
    const item = current()
    if (!isDisabled && item) onFocusReference(item)
  })

  inspectBtn?.addEventListener('click', () => {
    const item = current()
    if (!isDisabled && item) onInspectReference(item)
  })

  realDetailBtn?.addEventListener('click', async () => {
    const item = current()
    const detail = item ? detailAssetForNode(item.id) : null
    if (isDisabled || !item || !detail || detailLoadingNodeId) return

    detailLoadingNodeId = item.id
    failedDetailNodes.delete(item.id)
    renderAnatomy()
    try {
      const loaded = await onLoadRealDetail(item)
      if (loaded === false) {
        failedDetailNodes.add(item.id)
      } else {
        loadedDetailNodes.add(item.id)
        failedDetailNodes.delete(item.id)
        if (detail.sourceKind === 'generated-stl-package') {
          if (!detailPartVisibilityByNode.has(item.id)) {
            detailPartVisibilityByNode.set(item.id, new Map(detail.sourceParts.map(part => [part.id, true])))
          }
          if (!detailExplodeByNode.has(item.id)) detailExplodeByNode.set(item.id, 0)
        }
      }
    } catch {
      failedDetailNodes.add(item.id)
    } finally {
      detailLoadingNodeId = null
      renderAnatomy()
    }
  })

  realDetailExplodeSlider?.addEventListener('input', async () => {
    const item = current()
    const detail = item ? detailAssetForNode(item.id) : null
    if (!item || detail?.sourceKind !== 'generated-stl-package' || !loadedDetailNodes.has(item.id)) return
    const amount = Number(realDetailExplodeSlider.value) / 100
    const applied = await onSetRealDetailExplode(item, amount)
    if (applied === false) return
    detailExplodeByNode.set(item.id, amount)
    renderAnatomy()
  })

  searchInput?.addEventListener('input', () => {
    searchQuery = searchInput.value.trim()
    renderAnatomy()
  })

  searchInput?.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      const first = list?.querySelector('.anatomy-node')
      if (first) {
        event.preventDefault()
        first.focus()
      }
    } else if (event.key === 'Escape' && searchInput.value) {
      event.preventDefault()
      searchInput.value = ''
      searchQuery = ''
      renderAnatomy()
    }
  })

  copyBtn?.addEventListener('click', async () => {
    syncUrl()
    try {
      await navigator.clipboard.writeText(location.href)
      if (shareStatus) shareStatus.textContent = t('anatomy.copied')
    } catch {
      if (shareStatus) shareStatus.textContent = t('anatomy.copyFailed')
    }
    if (copyTimer !== null) window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      if (shareStatus) shareStatus.textContent = ''
    }, 2200)
  })

  const applyUrlState = () => {
    const nodeId = anatomyNodeIdFromSearch(location.search, nodeIds)
    mode = structureModeFromSearch(location.search, nodeIds)
    currentId = nodeId ?? saturnVAnatomyManifest.rootId
    searchQuery = ''
    if (searchInput) searchInput.value = ''
    render()
    const item = current()
    if (mode === 'anatomy' && !isDisabled && item?.focusAssemblyId) onFocusReference(item)
  }

  const updateReferenceMarker = () => {
    if (isDisabled || mode !== 'anatomy' || !referenceLayer || referenceLayer.hidden) return
    const item = current()
    const marker = referenceLayer.querySelector('.anatomy-reference-marker')
    if (!item || !marker) return
    const anchor = getReferenceAnchor(item)
    if (!anchor || anchor.visible === false || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
      marker.hidden = true
      return
    }
    marker.hidden = false
    marker.style.left = `${anchor.x}px`
    marker.style.top = `${anchor.y}px`
  }

  const setDisabled = value => {
    isDisabled = Boolean(value)
    render()
  }

  const handlePopState = () => applyUrlState()
  window.addEventListener('popstate', handlePopState)
  const unsubscribeLanguage = onLanguageChange(() => {
    render()
    syncUrl()
  })

  render()
  syncUrl()
  if (deepLinkedId && mode === 'anatomy' && !isDisabled) {
    const item = current()
    if (item?.focusAssemblyId) onFocusReference(item)
  }

  const resetRealDetailControls = () => {
    detailExplodeByNode.clear()
    detailPartVisibilityByNode.clear()
    renderAnatomy()
  }

  return {
    getMode: () => mode,
    getCurrentId: () => currentId,
    setDisabled,
    updateReferenceMarker,
    resetRealDetailControls,
    destroy: () => {
      unsubscribeLanguage()
      window.removeEventListener('popstate', handlePopState)
      if (copyTimer !== null) window.clearTimeout(copyTimer)
      detailLoadingNodeId = null
      loadedDetailNodes.clear()
      failedDetailNodes.clear()
      detailExplodeByNode.clear()
      detailPartVisibilityByNode.clear()
      referenceLayer?.replaceChildren()
    },
  }
}
