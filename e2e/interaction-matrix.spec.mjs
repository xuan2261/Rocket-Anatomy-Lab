import { test, expect } from '@playwright/test'

const ASSEMBLIES = [
  'base-assembly',
  'lower-body-assembly',
  'center-body-assembly',
  'upper-body-assembly',
  'nose-stack-assembly',
]

async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

async function openPanel(page, name) {
  const tab = page.locator(`[data-control-tab="${name}"]`)
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator(`[data-control-pane="${name}"]`)).toBeVisible()
}

function collectRuntimeErrors(page) {
  const errors = []
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

async function selectFromTree(page, assemblyId) {
  const row = page.locator(`#tree [data-assembly-id="${assemblyId}"]`)
  await row.locator('.tree-select').click()
  await expect(row).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', assemblyId)
}

async function pickFocusedAssemblyFromViewport(page, assemblyId, otherAssemblyId) {
  await openPanel(page, 'learning')
  const annotationToggle = page.locator('#learningAnnotationsBtn')
  if (await annotationToggle.getAttribute('aria-pressed') === 'true') await annotationToggle.click()
  await expect(annotationToggle).toHaveAttribute('aria-pressed', 'false')
  await page.locator('#learningFocusBtn').click()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))

  await openPanel(page, 'objects')
  await selectFromTree(page, otherAssemblyId)
  // Keep all five assemblies visible. No coordinate search, hidden context,
  // overlay click or direct selection-state mutation is used.
  await expect(page.locator('#tree input[type="checkbox"]:checked')).toHaveCount(5)
  const canvas = page.locator('#viewport')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  await expect(canvas).toHaveAttribute('data-selected-assembly', assemblyId)
}

async function setExplodeWithKeyboard(page, amount) {
  const slider = page.locator('#explodeSlider')
  await slider.focus()
  await slider.press('Home')
  if (amount === 100) await slider.press('End')
  else for (let index = 0; index < amount; index += 1) await slider.press('ArrowRight')
  await expect(slider).toHaveValue(String(amount))
  await expect(page.locator('#viewport')).toHaveAttribute('data-explode-percent', String(amount))
}

for (const language of ['vi', 'en']) {
  for (const [index, assemblyId] of ASSEMBLIES.entries()) {
    test(`3D interaction — ${language.toUpperCase()} ${assemblyId} @interaction-matrix`, async ({ page }) => {
      test.setTimeout(90_000)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const runtimeErrors = collectRuntimeErrors(page)
      const otherAssemblyId = ASSEMBLIES[(index + 1) % ASSEMBLIES.length]

      await page.goto(`/?lesson=${assemblyId}&lang=${language}`)
      await waitForRealAsset(page)
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', assemblyId)
      await page.reload()
      await waitForRealAsset(page)
      await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', assemblyId)

      await openPanel(page, 'objects')
      await selectFromTree(page, assemblyId)
      await pickFocusedAssemblyFromViewport(page, assemblyId, otherAssemblyId)

      await openPanel(page, 'view')
      await expect(page.locator('#viewport')).toHaveAttribute('data-view-mode', 'normal')
      for (const mode of ['ghost', 'xray', 'normal']) {
        await page.locator(`[data-mode="${mode}"]`).click()
        await expect(page.locator('#viewport')).toHaveAttribute('data-view-mode', mode)
      }
      for (const amount of [50, 100, 0]) await setExplodeWithKeyboard(page, amount)
      for (const theme of ['dark', 'light']) {
        await page.locator(`[data-theme-value="${theme}"]`).click()
        await expect(page.locator('#viewport')).toHaveAttribute('data-viewer-theme', theme)
      }

      await openPanel(page, 'objects')
      const isolate = page.locator('#isolateBtn')
      await isolate.click()
      await expect(page.locator('#viewport')).toHaveAttribute('data-isolated-assembly', assemblyId)
      await isolate.click()
      await expect(page.locator('#viewport')).toHaveAttribute('data-isolated-assembly', '')
      const selectedRow = page.locator(`#tree [data-assembly-id="${assemblyId}"]`)
      const visibility = selectedRow.locator('input[type="checkbox"]')
      await expect(visibility).toBeChecked()
      await page.locator('#hideBtn').click()
      await expect(visibility).not.toBeChecked()
      await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', '')
      await page.locator('#hideBtn').click()
      await expect(visibility).toBeChecked()
      await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', assemblyId)
      await page.locator('#showAllBtn').click()
      expect(runtimeErrors).toEqual([])
    })
  }
}
