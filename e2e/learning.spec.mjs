import { test, expect } from '@playwright/test'

async function waitForRealAsset(page) {
  const badge = page.locator('#assetStatus')
  await expect(badge).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

test.describe('Phase 6 — guided learning', () => {
  test('deep link opens the requested bilingual lesson and applies a learning view', async ({ page }, testInfo) => {
    await page.goto('/?lesson=lower-body-assembly&lang=en')
    await waitForRealAsset(page)

    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('#learningTitle')).toContainText('Lesson 2')
    await expect(page.locator('#inspectorTitle')).toContainText('Lower body assembly')
    await expect(page).toHaveURL(/lesson=lower-body-assembly/)
    await expect(page).toHaveURL(/lang=en/)

    await page.locator('#learningApplyViewBtn').click()
    await expect(page.locator('#sectionToggleBtn')).toContainText('Section: On')
    await expect(page.locator('#sectionStatus')).toContainText('Y')
    await expect(page.locator('#sectionStatus')).toContainText('26%')

    await page.locator('#learningNextBtn').click()
    await expect(page.locator('#learningTitle')).toContainText('Lesson 3')
    await expect(page.locator('#inspectorTitle')).toContainText('Center body assembly')
    await expect(page).toHaveURL(/lesson=center-body-assembly/)

    await page.locator('#learningApplyViewBtn').click()
    await expect(page.locator('#modeValue')).toContainText('Ghost')

    await testInfo.attach('phase6-guided-learning', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  })

  test('learning disclosure and annotations are keyboard-friendly UI controls', async ({ page }) => {
    await page.goto('/?lesson=base-assembly&lang=vi')
    await waitForRealAsset(page)

    const disclosure = page.locator('#learningToggleBtn')
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true')
    await disclosure.press('Enter')
    await expect(disclosure).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('#learningPanelBody')).toBeHidden()
    await disclosure.press('Space')
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true')

    const markers = page.locator('.annotation-marker')
    await expect(markers).toHaveCount(5)
    const annotationToggle = page.locator('#learningAnnotationsBtn')
    await expect(annotationToggle).toHaveAttribute('aria-pressed', 'true')
    await annotationToggle.click()
    await expect(annotationToggle).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('#annotationLayer')).toBeHidden()
  })

  test('fallback keeps Phase 6 fail-closed', async ({ page }) => {
    await page.goto('/?renderer=fallback&lesson=base-assembly')
    await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'fallback')
    await expect(page.locator('#learningNextBtn')).toBeDisabled()
    await expect(page.locator('#learningApplyViewBtn')).toBeDisabled()
    await expect(page.locator('#learningAnnotationsBtn')).toBeDisabled()
    await expect(page.locator('#learningTitle')).toContainText(/không khả dụng|unavailable/i)
  })
})
