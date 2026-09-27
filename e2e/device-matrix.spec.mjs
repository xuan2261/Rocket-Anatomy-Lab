import { test, expect } from '@playwright/test'
import {
  assertReducedMotion,
  exerciseViewportOrientation,
  waitForAnimationFrames,
} from '../scripts/lib/device-resilience.mjs'

const MOBILE_PROJECT = /android|iphone/i

async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

function collectRuntimeErrors(page) {
  const errors = []
  page.on('pageerror', error => errors.push('pageerror: ' + error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push('console: ' + message.text())
  })
  return errors
}

async function activate(locator, touch) {
  if (touch) await locator.tap()
  else await locator.click()
}

async function browserCapabilities(page) {
  return page.locator('#viewport').evaluate(canvas => {
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    const context = gl
      ? (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl')
      : null
    return {
      context,
      maxTouchPoints: navigator.maxTouchPoints,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: gl ? String(gl.getParameter(gl.VENDOR) ?? '') : '',
      renderer: gl ? String(gl.getParameter(gl.RENDERER) ?? '') : '',
    }
  })
}

test('browser/device matrix keeps the real WebGL scene usable @device-matrix', async ({ page }, testInfo) => {
  const touch = MOBILE_PROJECT.test(testInfo.project.name)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const runtimeErrors = collectRuntimeErrors(page)

  await page.goto('/?lang=en&lesson=center-body-assembly')
  await waitForRealAsset(page)
  const reducedMotion = await assertReducedMotion(page)
  const capabilities = await browserCapabilities(page)

  expect(capabilities.context).toMatch(/^webgl/)
  if (touch) expect(capabilities.maxTouchPoints).toBeGreaterThan(0)
  await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', 'center-body-assembly')

  const viewTab = page.locator('[data-control-tab="view"]')
  await activate(viewTab, touch)
  await expect(viewTab).toHaveAttribute('aria-selected', 'true')

  for (const mode of ['ghost', 'xray', 'normal']) {
    await activate(page.locator('[data-mode="' + mode + '"]'), touch)
    await expect(page.locator('#viewport')).toHaveAttribute('data-view-mode', mode)
  }

  let orientation = null
  if (touch) orientation = await exerciseViewportOrientation(page)

  await waitForAnimationFrames(page, 3)
  const overflow = await page.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    vertical: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
  }))
  expect(overflow).toEqual({ horizontal: false, vertical: false })
  expect(runtimeErrors).toEqual([])

  await testInfo.attach('device-matrix-runtime', {
    body: Buffer.from(JSON.stringify({
      project: testInfo.project.name,
      reducedMotion,
      capabilities,
      orientation,
    }, null, 2)),
    contentType: 'application/json',
  })
})
