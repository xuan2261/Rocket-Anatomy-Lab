import { test, expect } from '@playwright/test'

async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

async function stableScreenshot(page, name) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('[data-control-tab="learning"]').click()
  await page.locator('#learningAnnotationsBtn').click()
  await expect(page.locator('#learningAnnotationsBtn')).toHaveAttribute('aria-pressed', 'false')
  await page.locator('[data-control-tab="objects"]').click()

  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    mask: [page.locator('#viewport'), page.locator('#annotationLayer')],
    maxDiffPixelRatio: 0.001,
  })
}

for (const theme of ['light', 'dark']) {
  test(`visual shell — VI ${theme} @visual`, async ({ page }) => {
    await page.goto('/?lang=vi&lesson=center-body-assembly')
    await waitForRealAsset(page)
    await page.locator(`[data-theme-value="${theme}"]`).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await stableScreenshot(page, `shell-vi-${theme}.png`)
  })

  test(`visual shell — EN ${theme} @visual`, async ({ page }) => {
    await page.goto('/?lang=en&lesson=center-body-assembly')
    await waitForRealAsset(page)
    await page.locator(`[data-theme-value="${theme}"]`).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await stableScreenshot(page, `shell-en-${theme}.png`)
  })
}
