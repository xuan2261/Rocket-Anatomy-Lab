import { test, expect } from '@playwright/test'

async function waitForRealAsset(page) {
  const badge = page.locator('#assetStatus')
  await expect(badge).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
  await expect(badge).toContainText('GLB giáo dục hỗ trợ lắp/tách')
}

test.describe('Rocket Anatomy Lab — luồng chính', () => {
  test('tải mô hình thật, đổi VI/EN và ghi nhớ lựa chọn', async ({ page }) => {
    await page.goto('/')
    await waitForRealAsset(page)

    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
    await expect(page.getByRole('heading', { name: 'Các cụm giáo dục' })).toBeVisible()
    await expect(page.getByText('TRÌNH BÀY CÓ HƯỚNG DẪN')).toBeVisible()
    await expect(page.getByText('MẶT CẮT / QUAN SÁT BÊN TRONG')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ')

    await page.getByRole('button', { name: 'EN' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { name: 'Educational assemblies' })).toBeVisible()
    await expect(page.getByText('GUIDED PRESENTATION')).toBeVisible()
    await expect(page.getByText('SECTION / CUTAWAY')).toBeVisible()
    await expect(page.locator('#assetStatus')).toContainText('Assembly-capable educational GLB')
    await expect(page.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')

    await page.reload()
    await waitForRealAsset(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { name: 'Educational assemblies' })).toBeVisible()

    await page.getByRole('button', { name: 'VI' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
    await expect(page.getByRole('heading', { name: 'Các cụm giáo dục' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'VI' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('chọn cụm, tách cụm và điều khiển timeline', async ({ page }) => {
    await page.goto('/')
    await waitForRealAsset(page)
    await page.getByRole('button', { name: /Cụm mũi/ }).click()
    await expect(page.locator('#inspectorTitle')).toContainText('Cụm mũi')
    await page.locator('#timelineNextBtn').click()
    await expect(page.locator('#timelineStatus')).toContainText('Bước 1/5')
    await page.locator('#timelineDirectionBtn').click()
    await expect(page.locator('#timelineDirectionBtn')).toContainText('Hướng: Lắp lại')
    await page.locator('#timelineRestartBtn').click()
    await expect(page.locator('#timelineStatus')).toContainText('Trạng thái lắp ghép ban đầu')
  })

  test('mặt cắt hoạt động cùng các chế độ xem', async ({ page }) => {
    await page.goto('/')
    await waitForRealAsset(page)
    await page.locator('#sectionToggleBtn').click()
    await expect(page.locator('#sectionToggleBtn')).toContainText('Mặt cắt: Bật')
    await page.locator('[data-section-axis="x"]').click()
    await page.locator('#sectionSlider').evaluate(el => { el.value = '65'; el.dispatchEvent(new Event('input', { bubbles: true })) })
    await expect(page.locator('#sectionStatus')).toContainText('X')
    await page.locator('#sectionInvertBtn').click()
    await expect(page.locator('#sectionInvertBtn')).toContainText('Hướng: Đảo')
    await page.locator('[data-mode="ghost"]').click()
    await expect(page.locator('#modeValue')).toContainText('Bóng mờ')
  })

  test('tôn trọng reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await waitForRealAsset(page)
    await expect(page.locator('#timelineMotionBadge')).toHaveText('Chuyển động: giảm')
  })
})

test('responsive: không tràn ngang và nút chính đạt 44px', async ({ page }) => {
  await page.goto('/')
  await waitForRealAsset(page)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  expect(overflow).toBeFalsy()
  for (const selector of ['#timelineNextBtn', '#sectionToggleBtn', '#resetBtn']) {
    const box = await page.locator(selector).boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  }
})

test('fallback vẫn fail-closed cho tính năng cần GLB thật', async ({ page }) => {
  await page.goto('/?renderer=fallback')
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'fallback')
  await expect(page.locator('#sectionToggleBtn')).toBeDisabled()
  await expect(page.locator('#timelinePlayBtn')).toBeDisabled()
})
