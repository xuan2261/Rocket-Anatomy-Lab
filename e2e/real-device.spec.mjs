import { test, expect } from '@playwright/test'

async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 45_000 })
}

test('real mobile device renders the tested Three.js scene and accepts touch controls @real-device', async ({ page }, testInfo) => {
  await page.goto('/?lang=en&lesson=center-body-assembly')
  await waitForRealAsset(page)

  const canvas = page.locator('#viewport')
  await expect(canvas).toHaveAttribute('data-selected-assembly', 'center-body-assembly')

  const capability = await canvas.evaluate(element => {
    const gl = element.getContext('webgl2') ?? element.getContext('webgl')
    return {
      context: gl
        ? (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl')
        : null,
      maxTouchPoints: navigator.maxTouchPoints,
      userAgent: navigator.userAgent,
      width: window.innerWidth,
      height: window.innerHeight,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      verticalOverflow: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    }
  })

  expect(capability.context).toMatch(/^webgl/)
  expect(capability.horizontalOverflow).toBe(false)
  expect(capability.verticalOverflow).toBe(false)

  const viewTab = page.locator('[data-control-tab="view"]')
  await viewTab.tap()
  await expect(viewTab).toHaveAttribute('aria-selected', 'true')

  for (const mode of ['ghost', 'xray', 'normal']) {
    await page.locator('[data-mode="' + mode + '"]').tap()
    await expect(canvas).toHaveAttribute('data-view-mode', mode)
  }

  await testInfo.attach('real-device-runtime', {
    body: Buffer.from(JSON.stringify({
      expectedRevision: process.env.EXPECTED_REVISION,
      project: testInfo.project.name,
      capability,
    }, null, 2)),
    contentType: 'application/json',
  })
})
