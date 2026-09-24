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
  await page.locator('#learningFocusBtn').click()
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  }))

  await openPanel(page, 'objects')
  await selectFromTree(page, otherAssemblyId)

  // Keep the target as the only visible assembly so the test validates the
  // real canvas/raycaster path without being nondeterministic when another
  // assembly occludes it from the current camera direction.
  for (const id of ASSEMBLIES) {
    if (id === assemblyId) continue
    const checkbox = page.locator(`#tree [data-assembly-id="${id}"] input[type="checkbox"]`)
    if (await checkbox.isChecked()) await checkbox.uncheck()
  }

  const canvas = page.locator('#viewport')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()

  const fractions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9, 0.05, 0.95]

  for (const fy of fractions) {
    for (const fx of fractions) {
      const x = box.x + box.width * fx
      const y = box.y + box.height * fy
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
