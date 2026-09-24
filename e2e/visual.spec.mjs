import { test, expect } from '@playwright/test'

async function waitForDeterministicShell(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'fallback', { timeout: 10_000 })
  await expect(page.locator('[data-control-tab="objects"]')).toHaveAttribute('aria-selected', 'true')
}

async function stableScreenshot(page, name) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
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
    await page.goto('/?renderer=fallback&lang=vi')
    await waitForDeterministicShell(page)
    await page.locator(`[data-theme-value="${theme}"]`).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await stableScreenshot(page, `shell-vi-${theme}.png`)
  })

  test(`visual shell — EN ${theme} @visual`, async ({ page }) => {
    await page.goto('/?renderer=fallback&lang=en')
    await waitForDeterministicShell(page)
    await page.locator(`[data-theme-value="${theme}"]`).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await stableScreenshot(page, `shell-en-${theme}.png`)
  })
}
