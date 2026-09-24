import { test, expect } from '@playwright/test'

async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

async function stableScreenshot(page, name) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#learningAnnotationsBtn').click()
  await expect(page.locator('#learningAnnotationsBtn')).toHaveAttribute('aria-pressed', 'false')

  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    mask: [page.locator('#viewport'), page.locator('#annotationLayer')],
    maxDiffPixelRatio: 0.001,
  })
}

test('visual shell — VI @visual', async ({ page }) => {
  await page.goto('/?lang=vi&lesson=center-body-assembly')
  await waitForRealAsset(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  await stableScreenshot(page, 'shell-vi.png')
})

test('visual shell — EN @visual', async ({ page }) => {
  await page.goto('/?lang=en&lesson=center-body-assembly')
  await waitForRealAsset(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await stableScreenshot(page, 'shell-en.png')
})
