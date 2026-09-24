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


async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

async function settleWebGL(page) {
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  }))
}

function collectRuntimeErrors(page) {
  const errors = []
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

async function captureViewer(page, name) {
  await settleWebGL(page)
  await expect(page.locator('#viewport')).toHaveScreenshot(name, {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.003,
  })
}

for (const language of ['vi', 'en']) {
  test(`selection visual contract — ${language.toUpperCase()} normal/ghost/xray @visual`, async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/?lesson=base-assembly&lang=${language}`)
    await waitForRealAsset(page)

    await page.reload()
    await waitForRealAsset(page)
    await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', 'base-assembly')
    await expect(page.locator('[data-mode="normal"]')).toHaveAttribute('aria-pressed', 'true')
    await captureViewer(page, `selection-reload-${language}-normal.png`)

    await page.locator('[data-control-tab="objects"]').click()
    await page.locator('#tree .tree-select').nth(2).click()
    await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', 'center-body-assembly')
    await expect(page.locator('[data-mode="normal"]')).toHaveAttribute('aria-pressed', 'true')
    await captureViewer(page, `selection-center-${language}-normal.png`)

    await page.locator('[data-control-tab="view"]').click()
    await page.locator('[data-mode="ghost"]').click()
    await expect(page.locator('[data-mode="ghost"]')).toHaveAttribute('aria-pressed', 'true')
    await captureViewer(page, `selection-center-${language}-ghost.png`)

    await page.locator('[data-mode="xray"]').click()
    await expect(page.locator('[data-mode="xray"]')).toHaveAttribute('aria-pressed', 'true')
    await captureViewer(page, `selection-center-${language}-xray.png`)

    expect(runtimeErrors).toEqual([])
  })
}
