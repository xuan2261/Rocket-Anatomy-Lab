import { test, expect } from '@playwright/test'

async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

async function inViewport(locator) {
  return locator.evaluate(el => {
    const rect = el.getBoundingClientRect()
    return rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
  })
}

function center(box) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

async function runPrimaryTask(page, task) {
  const controlCenter = page.locator('.control-center')
  const tab = page.locator(`[data-control-tab="${task.tab}"]`)
  const pane = page.locator(`[data-control-pane="${task.tab}"]`)
  let actions = 0

  if (await tab.getAttribute('aria-selected') !== 'true') {
    await expect.poll(() => inViewport(tab)).toBe(true)
    await tab.click()
    actions += 1
  }

  await expect(tab).toHaveAttribute('aria-selected', 'true')
  await expect(pane).toBeVisible()
  expect(await pane.evaluate(el => el.scrollTop)).toBe(0)

  const action = task.action(page)
  await expect(action).toBeVisible()
  await expect.poll(() => inViewport(action)).toBe(true)

  const [centerBox, tabBox, actionBox] = await Promise.all([
    controlCenter.boundingBox(),
    tab.boundingBox(),
    action.boundingBox(),
  ])
  expect(centerBox).not.toBeNull()
  expect(tabBox).not.toBeNull()
  expect(actionBox).not.toBeNull()

  const cc = centerBox
  const actionCenter = center(actionBox)
  expect(actionCenter.x).toBeGreaterThanOrEqual(cc.x)
  expect(actionCenter.x).toBeLessThanOrEqual(cc.x + cc.width)
  expect(actionCenter.y).toBeGreaterThanOrEqual(cc.y)
  expect(actionCenter.y).toBeLessThanOrEqual(cc.y + cc.height)

  const pointerDistance = distance(center(tabBox), actionCenter)
  const controlDiagonal = Math.hypot(cc.width, cc.height)

  await action.click()
  actions += 1
  await task.verify(page)

  expect(actions).toBeLessThanOrEqual(task.maxActions)

  return {
    task: task.name,
    actions,
    pointerDistanceCssPx: Math.round(pointerDistance),
    controlCenterDiagonalCssPx: Math.round(controlDiagonal),
    normalizedPointerDistance: Number((pointerDistance / controlDiagonal).toFixed(3)),
  }
}

test('5 tác vụ chính ở trong một Control Center, không cần cuộn toàn trang @usability', async ({ page }, testInfo) => {
  await page.goto('/?lang=vi')
  await waitForRealAsset(page)

  const initialScroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))
  expect(initialScroll).toEqual({ x: 0, y: 0 })

  const tasks = [
    {
      name: 'select-object',
      tab: 'objects',
      action: page => page.locator('#tree .tree-select').first(),
      maxActions: 1,
      verify: async page => {
        await expect(page.locator('#inspectorTitle')).not.toHaveText('Chưa chọn')
      },
    },
    {
      name: 'change-view-mode',
      tab: 'view',
      action: page => page.locator('[data-mode="ghost"]'),
      maxActions: 2,
      verify: async page => {
        await expect(page.locator('#modeValue')).toContainText('Bóng mờ')
      },
    },
    {
      name: 'advance-presentation',
      tab: 'timeline',
      action: page => page.locator('#timelineNextBtn'),
      maxActions: 2,
      verify: async page => {
        await expect(page.locator('#timelineStatus')).toContainText('Bước 1/5')
      },
    },
    {
      name: 'advance-learning',
      tab: 'learning',
      action: page => page.locator('#learningNextBtn'),
      maxActions: 2,
      verify: async page => {
        await expect(page.locator('#learningTitle')).toContainText('Bài 2')
      },
    },
    {
      name: 'toggle-section',
      tab: 'section',
      action: page => page.locator('#sectionToggleBtn'),
      maxActions: 2,
      verify: async page => {
        await expect(page.locator('#sectionToggleBtn')).toContainText('Mặt cắt: Bật')
      },
    },
  ]

  const metrics = []
  for (const task of tasks) {
    metrics.push(await runPrimaryTask(page, task))
    expect(await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))).toEqual(initialScroll)
  }

  const overflow = await page.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    vertical: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
  }))
  expect(overflow).toEqual({ horizontal: false, vertical: false })

  await testInfo.attach('phase9-usability-metrics', {
    body: Buffer.from(JSON.stringify({
      project: testInfo.project.name,
      note: 'Pointer distance is an automated geometric proxy, not a human usability-study result.',
      tasks: metrics,
    }, null, 2)),
    contentType: 'application/json',
  })
})

test('tablist dùng roving tabindex và Tab đi thẳng vào panel đang mở @usability', async ({ page }) => {
  await page.goto('/?lang=vi')
  await waitForRealAsset(page)

  const objects = page.locator('[data-control-tab="objects"]')
  const view = page.locator('[data-control-tab="view"]')
  const section = page.locator('[data-control-tab="section"]')

  await objects.focus()
  await expect(objects).toHaveAttribute('tabindex', '0')
  await objects.press('ArrowRight')
  await expect(view).toBeFocused()
  await expect(view).toHaveAttribute('tabindex', '0')
  await expect(objects).toHaveAttribute('tabindex', '-1')

  await view.press('End')
  await expect(section).toBeFocused()
  await expect(section).toHaveAttribute('tabindex', '0')
  await page.keyboard.press('Tab')
  await expect(page.locator('#sectionToggleBtn')).toBeFocused()
})

test('skip link đưa keyboard focus trực tiếp vào viewport @usability', async ({ page }) => {
  await page.goto('/?renderer=fallback&lang=vi')

  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#viewport')).toBeFocused()
})

test('mobile coarse-pointer có touch target cao/rộng 48 px ở control chính @usability', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Chỉ áp dụng cho project mobile/coarse-pointer')

  await page.goto('/?lang=vi')
  await waitForRealAsset(page)

  const selectors = [
    '[data-theme-value="dark"]',
    '[data-language="vi"]',
    '[data-control-tab="objects"]',
    '[data-control-tab="section"]',
  ]

  for (const selector of selectors) {
    const box = await page.locator(selector).boundingBox()
    expect(box).not.toBeNull()
    expect(box.height).toBeGreaterThanOrEqual(48)
    expect(box.width).toBeGreaterThanOrEqual(48)
  }

  await page.locator('[data-control-tab="section"]').click()
  const sectionBox = await page.locator('#sectionToggleBtn').boundingBox()
  expect(sectionBox).not.toBeNull()
  expect(sectionBox.height).toBeGreaterThanOrEqual(48)
  expect(sectionBox.width).toBeGreaterThanOrEqual(48)
})
