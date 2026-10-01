import { test, expect } from '@playwright/test'

async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 45_000 })
}

async function runtimeSnapshot(canvas) {
  return canvas.evaluate(element => {
    const gl = element.getContext('webgl2') ?? element.getContext('webgl')
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info') ?? null
    const landscape = window.innerWidth > window.innerHeight
    return {
      context: gl
        ? (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl')
        : null,
      maxTouchPoints: navigator.maxTouchPoints,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      screen: { width: screen.width, height: screen.height },
      orientation: screen.orientation?.type ?? (landscape ? 'landscape-derived' : 'portrait-derived'),
      orientationAngle: screen.orientation?.angle ?? null,
      devicePixelRatio: window.devicePixelRatio,
      webglVendor: gl ? String(gl.getParameter(gl.VENDOR) ?? '') : '',
      webglRenderer: gl ? String(gl.getParameter(gl.RENDERER) ?? '') : '',
      webglUnmaskedVendor: gl && debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) ?? '') : null,
      webglUnmaskedRenderer: gl && debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '') : null,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      verticalOverflow: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    }
  })
}

test('real mobile device renders the tested Three.js scene and accepts touch controls @real-device', async ({ page }, testInfo) => {
  await page.goto('/?lang=en&lesson=center-body-assembly')
  await waitForRealAsset(page)

  const canvas = page.locator('#viewport')
  await expect(canvas).toHaveAttribute('data-selected-assembly', 'center-body-assembly')

  const initialCapability = await runtimeSnapshot(canvas)
  expect(initialCapability.context).toMatch(/^webgl/)
  expect(initialCapability.horizontalOverflow).toBe(false)
  expect(initialCapability.verticalOverflow).toBe(false)

  const viewTab = page.locator('[data-control-tab="view"]')
  await viewTab.tap()
  await expect(viewTab).toHaveAttribute('aria-selected', 'true')

  for (const mode of ['ghost', 'xray', 'normal']) {
    await page.locator('[data-mode="' + mode + '"]').tap()
    await expect(canvas).toHaveAttribute('data-view-mode', mode)
  }

  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitForRealAsset(page)
  await expect(canvas).toHaveAttribute('data-selected-assembly', 'center-body-assembly')
  expect(new URL(page.url()).searchParams.get('lesson')).toBe('center-body-assembly')

  const sectionTab = page.locator('[data-control-tab="section"]')
  await sectionTab.tap()
  await expect(sectionTab).toHaveAttribute('aria-selected', 'true')
  const sectionToggle = page.locator('#sectionToggleBtn')
  await expect(sectionToggle).toHaveAttribute('aria-pressed', 'false')
  await sectionToggle.tap()
  await expect(sectionToggle).toHaveAttribute('aria-pressed', 'true')

  const helpTab = page.locator('[data-control-tab="help"]')
  await helpTab.tap()
  await expect(helpTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#paneHelp')).toBeVisible()

  const finalCapability = await runtimeSnapshot(canvas)
  expect(finalCapability.context).toMatch(/^webgl/)
  expect(finalCapability.horizontalOverflow).toBe(false)
  expect(finalCapability.verticalOverflow).toBe(false)

  await testInfo.attach('real-device-runtime', {
    body: Buffer.from(JSON.stringify({
      expectedRevision: process.env.EXPECTED_REVISION,
      project: testInfo.project.name,
      initialCapability,
      finalCapability,
    }, null, 2)),
    contentType: 'application/json',
  })

  const finalStateScreenshot = await page.screenshot()
  await testInfo.attach('real-device-final-state', {
    body: finalStateScreenshot,
    contentType: 'image/png',
  })
})
