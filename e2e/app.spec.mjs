import { test, expect } from '@playwright/test'

async function waitForRealAsset(page) {
  const badge = page.locator('#assetStatus')
  await expect(badge).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

async function openControlPanel(page, name) {
  const tab = page.locator(`[data-control-tab="${name}"]`)
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator(`[data-control-pane="${name}"]`)).toBeVisible()
}

test.describe('Rocket Anatomy Lab — luồng chính', () => {
  test('tải mô hình thật, đổi VI/EN và ghi nhớ lựa chọn', async ({ page }) => {
    await page.goto('/')
    await waitForRealAsset(page)

    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
    await expect(page.locator('#assetStatus')).toContainText('GLB giáo dục hỗ trợ lắp/tách')
    await expect(page.getByRole('heading', { name: 'Các cụm giáo dục' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ')
    await expect(page.locator('[data-control-tab="objects"]')).toHaveText('Đối tượng')
    await expect(page.locator('[data-control-tab="section"]')).toHaveText('Mặt cắt')

    await page.locator('[data-language="en"]').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { name: 'Educational assemblies' })).toBeVisible()
    await expect(page.locator('#assetStatus')).toContainText('Assembly-capable educational GLB')
    await expect(page.locator('[data-language="en"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-control-tab="timeline"]')).toHaveText('Presentation')
    await expect(page.locator('[data-control-tab="section"]')).toHaveText('Section')

    await page.reload()
    await waitForRealAsset(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { name: 'Educational assemblies' })).toBeVisible()

    await page.locator('[data-language="vi"]').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
    await expect(page.getByRole('heading', { name: 'Các cụm giáo dục' })).toBeVisible()
    await expect(page.locator('[data-language="vi"]')).toHaveAttribute('aria-pressed', 'true')
  })

  test('light/dark theme có thể đổi và ghi nhớ', async ({ page }) => {
    await page.goto('/')
    await waitForRealAsset(page)

    await page.locator('[data-theme-value="dark"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('[data-theme-value="dark"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0a0f16')

    await page.reload()
    await waitForRealAsset(page)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.locator('[data-theme-value="light"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('[data-theme-value="light"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f6f8fb')
  })

  test('chọn cụm, tách cụm và điều khiển timeline trong Control Center', async ({ page }) => {
    await page.goto('/')
    await waitForRealAsset(page)

    await openControlPanel(page, 'objects')
    await page.locator('#tree').getByRole('button', { name: /Cụm mũi/ }).click()
    await expect(page.locator('#inspectorTitle')).toContainText('Cụm mũi')

    await openControlPanel(page, 'timeline')
    await page.locator('#timelineNextBtn').click()
    await expect(page.locator('#timelineStatus')).toContainText('Bước 1/5')
    await page.locator('#timelineDirectionBtn').click()
    await expect(page.locator('#timelineDirectionBtn')).toContainText('Hướng: Lắp lại')
    await page.locator('#timelineRestartBtn').click()
    await expect(page.locator('#timelineStatus')).toContainText('Trạng thái lắp ghép ban đầu')
  })

  test('preset khám phá bên trong kết hợp X-quang, mặt cắt và vùng đang chọn', async ({ page }) => {
    await page.goto('/')
    await waitForRealAsset(page)

    await openControlPanel(page, 'objects')
    await page.locator('#tree').getByRole('button', { name: /Cụm thân dưới/ }).click()

    await openControlPanel(page, 'view')
    await page.locator('#inspectInsideBtn').click()
    await expect(page.locator('#modeValue')).toContainText('X-quang')

    await openControlPanel(page, 'section')
    await expect(page.locator('#sectionToggleBtn')).toContainText('Mặt cắt: Bật')
    await expect(page.locator('#sectionStatus')).toContainText('Y')
    await expect(page.locator('#sectionStatus')).toContainText('26%')
  })

  test('mặt cắt hoạt động cùng các chế độ xem trong cùng Control Center', async ({ page }) => {
    await page.goto('/')
    await waitForRealAsset(page)

    await openControlPanel(page, 'section')
    await page.locator('#sectionToggleBtn').click()
    await expect(page.locator('#sectionToggleBtn')).toContainText('Mặt cắt: Bật')
    await page.locator('[data-section-axis="x"]').click()
    await page.locator('#sectionSlider').evaluate(el => { el.value = '65'; el.dispatchEvent(new Event('input', { bubbles: true })) })
    await expect(page.locator('#sectionStatus')).toContainText('X')
    await page.locator('#sectionInvertBtn').click()
    await expect(page.locator('#sectionInvertBtn')).toContainText('Hướng: Đảo')

    await openControlPanel(page, 'view')
    await page.locator('[data-mode="ghost"]').click()
    await expect(page.locator('#modeValue')).toContainText('Bóng mờ')
  })

  test('tablist hỗ trợ bàn phím và giữ focus rõ ràng', async ({ page }) => {
    await page.goto('/')
    await waitForRealAsset(page)

    const objects = page.locator('[data-control-tab="objects"]')
    await objects.focus()
    await objects.press('ArrowRight')
    await expect(page.locator('[data-control-tab="view"]')).toBeFocused()
    await expect(page.locator('[data-control-tab="view"]')).toHaveAttribute('aria-selected', 'true')
    await page.locator('[data-control-tab="view"]').press('End')
    await expect(page.locator('[data-control-tab="section"]')).toBeFocused()
    await expect(page.locator('[data-control-tab="section"]')).toHaveAttribute('aria-selected', 'true')
  })

  test('tôn trọng reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await waitForRealAsset(page)
    await openControlPanel(page, 'timeline')
    await expect(page.locator('#timelineMotionBadge')).toHaveText('Chuyển động: giảm')
  })
})

test('responsive: không tràn trang và nút chính đạt 44px', async ({ page }) => {
  await page.goto('/')
  await waitForRealAsset(page)

  const overflow = await page.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    vertical: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
  }))
  expect(overflow.horizontal).toBeFalsy()
  expect(overflow.vertical).toBeFalsy()

  for (const selector of ['[data-control-tab="objects"]', '[data-theme-value="dark"]', '#showAllBtn']) {
    const box = await page.locator(selector).boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  }
})

test('fallback vẫn fail-closed cho tính năng cần GLB thật', async ({ page }) => {
  await page.goto('/?renderer=fallback')
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'fallback')

  await openControlPanel(page, 'section')
  await expect(page.locator('#sectionToggleBtn')).toBeDisabled()

  await openControlPanel(page, 'timeline')
  await expect(page.locator('#timelinePlayBtn')).toBeDisabled()
})
