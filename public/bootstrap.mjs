const status = document.querySelector('#assetStatus')

async function start() {
  const forcedFallback = new URLSearchParams(location.search).get('renderer') === 'fallback'
  if (forcedFallback) {
    status.textContent = 'Hình học dự phòng bắt buộc'
    status.dataset.state = 'fallback'
    await import('./fallback-app.mjs')
    return
  }
  try {
    status.textContent = 'Đang tải mô hình giáo dục có thể lắp/tách…'
    await import('./real-app.mjs')
  } catch (error) {
    console.warn('[Rocket Anatomy Lab] Real GLB renderer unavailable; using procedural fallback.', error)
    status.textContent = 'Hình học dự phòng ngoại tuyến'
    status.dataset.state = 'fallback'
    await import('./fallback-app.mjs')
  }
}

start()
