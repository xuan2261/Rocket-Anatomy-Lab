import { initializeI18n, t } from './i18n.mjs'
import { initializeWorkspaceUi } from './workspace-ui.mjs'

initializeI18n()
initializeWorkspaceUi()

const status = document.querySelector('#assetStatus')

async function start() {
  const forcedFallback = new URLSearchParams(location.search).get('renderer') === 'fallback'
  if (forcedFallback) {
    status.textContent = t('app.assetFallbackForced')
    status.dataset.state = 'fallback'
    await import('./fallback-app.mjs')
    return
  }
  try {
    status.textContent = t('app.assetLoadingAssembly')
    await import('./real-app.mjs')
  } catch (error) {
    console.warn('[Rocket Anatomy Lab] Real GLB renderer unavailable; using procedural fallback.', error)
    status.textContent = t('app.assetFallbackOffline')
    status.dataset.state = 'fallback'
    await import('./fallback-app.mjs')
  }
}

start()
