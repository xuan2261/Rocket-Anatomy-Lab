import { test, expect } from '@playwright/test'
import {
  assertReducedMotion,
  exercisePinchZoom,
  exerciseViewportOrientation,
  exerciseWebglContextRecovery,
} from '../scripts/lib/device-resilience.mjs'

async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

function collectRuntimeErrors(page) {
  const errors = []
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

test('WebGL context loss restores the tested scene and interaction @device-resilience', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const runtimeErrors = collectRuntimeErrors(page)
  await page.goto('/?lang=en&lesson=center-body-assembly')
  await waitForRealAsset(page)
  const reducedMotion = await assertReducedMotion(page)
  const webglContext = await exerciseWebglContextRecovery(page)

  await page.locator('[data-control-tab="view"]').click()
  await page.locator('[data-mode="ghost"]').click()
  await expect(page.locator('#viewport')).toHaveAttribute('data-view-mode', 'ghost')
  await page.locator('[data-mode="normal"]').click()
  await expect(page.locator('#viewport')).toHaveAttribute('data-view-mode', 'normal')
  await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', 'center-body-assembly')
  expect(runtimeErrors).toEqual([])

  await testInfo.attach('webgl-resilience', {
    body: Buffer.from(JSON.stringify({ project: testInfo.project.name, reducedMotion, webglContext }, null, 2)),
    contentType: 'application/json',
  })
})

test('mobile portrait/landscape resize preserves state and pinch changes the camera @device-resilience', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile emulation only')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  const runtimeErrors = collectRuntimeErrors(page)
  await page.goto('/?lang=vi&lesson=center-body-assembly')
  await waitForRealAsset(page)
  const reducedMotion = await assertReducedMotion(page)
  const orientation = await exerciseViewportOrientation(page)
  const pinch = await exercisePinchZoom(page)

  await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', 'center-body-assembly')
  expect(pinch.changed).toBe(true)
  expect(runtimeErrors).toEqual([])

  await testInfo.attach('mobile-resilience', {
    body: Buffer.from(JSON.stringify({ project: testInfo.project.name, reducedMotion, orientation, pinch }, null, 2)),
    contentType: 'application/json',
  })
})
