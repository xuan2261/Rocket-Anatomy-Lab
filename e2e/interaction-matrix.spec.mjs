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
  if (await annotationToggle.getAttribute('aria-pressed') !== 'true') await annotationToggle.click()
  await expect(annotationToggle).toHaveAttribute('aria-pressed', 'true')

  await page.locator('#learningFocusBtn').click()
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  }))

  const marker = page.locator(`[data-annotation-id="${assemblyId}"]`)
  await expect(marker).toBeVisible()

  await openPanel(page, 'objects')
  await selectFromTree(page, otherAssemblyId)

  // Keep the target as the only visible assembly so a click through the
  // projected lesson anchor exercises the real Three.js raycaster without
  // another assembly winning the nearest-intersection test.
  for (const id of ASSEMBLIES) {
    if (id === assemblyId) continue
    const checkbox = page.locator(`#tree [data-assembly-id="${id}"] input[type="checkbox"]`)
    if (await checkbox.isChecked()) await checkbox.uncheck()
  }

  await expect(marker).toBeVisible()
  await marker.evaluate(element => { element.style.pointerEvents = 'none' })

  const canvas = page.locator('#viewport')
  const [canvasBox, markerBox] = await Promise.all([canvas.boundingBox(), marker.boundingBox()])
  expect(canvasBox).not.toBeNull()
  expect(markerBox).not.toBeNull()

  const centerX = markerBox.x + markerBox.width / 2
  const centerY = markerBox.y + markerBox.height / 2
  const offsets = [0, -12, 12, -24, 24, -36, 36, -52, 52]

  for (const dy of offsets) {
    for (const dx of offsets) {
      const x = Math.min(canvasBox.x + canvasBox.width - 2, Math.max(canvasBox.x + 2, centerX + dx))
      const y = Math.min(canvasBox.y + canvasBox.height - 2, Math.max(canvasBox.y + 2, centerY + dy))
      await page.mouse.click(x, y)
      if (await canvas.getAttribute('data-selected-assembly') === assemblyId) {
        await page.locator('#showAllBtn').click()
        return
      }
    }
  }

  await expect(canvas).toHaveAttribute('data-selected-assembly', assemblyId)
  await page.locator('#showAllBtn').click()
}

for (const language of ['vi', 'en']) {
  test(`full 3D interaction matrix — ${language.toUpperCase()} @interaction-matrix`, async ({ page }) => {
    test.setTimeout(240_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const runtimeErrors = collectRuntimeErrors(page)

    for (let index = 0; index < ASSEMBLIES.length; index += 1) {
      const assemblyId = ASSEMBLIES[index]
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

      await page.locator('[data-mode="ghost"]').click()
      await expect(page.locator('#viewport')).toHaveAttribute('data-view-mode', 'ghost')
      await page.locator('[data-mode="xray"]').click()
      await expect(page.locator('#viewport')).toHaveAttribute('data-view-mode', 'xray')
      await page.locator('[data-mode="normal"]').click()
      await expect(page.locator('#viewport')).toHaveAttribute('data-view-mode', 'normal')

      const explode = page.locator('#explodeSlider')
      await explode.fill('50')
      await expect(page.locator('#viewport')).toHaveAttribute('data-explode-percent', '50')
      await explode.fill('100')
      await expect(page.locator('#viewport')).toHaveAttribute('data-explode-percent', '100')
      await explode.fill('0')
      await expect(page.locator('#viewport')).toHaveAttribute('data-explode-percent', '0')

      await page.locator('[data-theme-value="dark"]').click()
      await expect(page.locator('#viewport')).toHaveAttribute('data-viewer-theme', 'dark')
      await page.locator('[data-theme-value="light"]').click()
      await expect(page.locator('#viewport')).toHaveAttribute('data-viewer-theme', 'light')

      await openPanel(page, 'objects')
      const isolate = page.locator('#isolateBtn')
      await isolate.click()
      await expect(page.locator('#viewport')).toHaveAttribute('data-isolated-assembly', assemblyId)
      await isolate.click()
      await expect(page.locator('#viewport')).toHaveAttribute('data-isolated-assembly', '')

      const selectedRow = page.locator(`#tree [data-assembly-id="${assemblyId}"]`)
      const selectedVisibility = selectedRow.locator('input[type="checkbox"]')
      await expect(selectedVisibility).toBeChecked()
      await page.locator('#hideBtn').click()
      await expect(selectedVisibility).not.toBeChecked()
      await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', '')
      await page.locator('#hideBtn').click()
      await expect(selectedVisibility).toBeChecked()
      await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', assemblyId)

      await page.locator('#showAllBtn').click()
    }

    expect(runtimeErrors).toEqual([])
  })
}
