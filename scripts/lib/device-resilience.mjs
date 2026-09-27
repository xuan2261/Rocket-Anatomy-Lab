import { createHash } from 'node:crypto'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export async function waitForAnimationFrames(page, count = 3) {
  await page.evaluate(async frameCount => {
    for (let index = 0; index < frameCount; index += 1) {
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
  }, count)
}

export async function assertReducedMotion(page) {
  const matches = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  if (!matches) throw new Error('Reduced-motion emulation is not active')
  return { matches: true }
}

export async function exerciseWebglContextRecovery(page, selector = '#viewport') {
  const result = await page.evaluate(async canvasSelector => {
    const canvas = document.querySelector(canvasSelector)
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('WebGL canvas not found')

    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) throw new Error('WebGL context unavailable')
    const extension = gl.getExtension('WEBGL_lose_context')
    if (!extension) throw new Error('WEBGL_lose_context unavailable')

    const waitForEvent = (name, timeoutMs = 5_000) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${name} did not fire within ${timeoutMs} ms`)), timeoutMs)
      canvas.addEventListener(name, event => {
        clearTimeout(timer)
        resolve({ type: event.type, statusMessage: event.statusMessage ?? '' })
      }, { once: true })
    })

    const lostPromise = waitForEvent('webglcontextlost')
    extension.loseContext()
    const lostEvent = await lostPromise
    const lostState = gl.isContextLost()

    const restoredPromise = waitForEvent('webglcontextrestored')
    extension.restoreContext()
    const restoredEvent = await restoredPromise
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    return {
      lostEvent: lostEvent.type,
      restoredEvent: restoredEvent.type,
      lostState,
      finalLostState: gl.isContextLost(),
    }
  }, selector)

  if (!result.lostState) throw new Error('WebGL context did not report a lost state')
  if (result.finalLostState) throw new Error('WebGL context remained lost after restore')
  return result
}

async function viewportSnapshot(page, selector) {
  return page.evaluate(canvasSelector => {
    const canvas = document.querySelector(canvasSelector)
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Viewport canvas not found')
    const rect = canvas.getBoundingClientRect()
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      canvasWidth: Math.round(rect.width),
      canvasHeight: Math.round(rect.height),
      selectedAssembly: canvas.dataset.selectedAssembly ?? '',
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      verticalOverflow: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    }
  }, selector)
}

async function setViewportAndVerify(page, size, selector, selectedAssembly) {
  await page.setViewportSize(size)
  await page.waitForFunction(
    expected => window.innerWidth === expected.width && window.innerHeight === expected.height,
    size,
  )
  await waitForAnimationFrames(page, 3)
  const state = await viewportSnapshot(page, selector)
  if (state.horizontalOverflow || state.verticalOverflow) {
    throw new Error(`Document overflow after viewport resize to ${size.width}x${size.height}`)
  }
  if (state.canvasWidth < 1 || state.canvasHeight < 1) throw new Error('Canvas collapsed after viewport resize')
  if (selectedAssembly && state.selectedAssembly !== selectedAssembly) {
    throw new Error(`Selection changed after viewport resize: expected ${selectedAssembly}, got ${state.selectedAssembly}`)
  }
  return state
}

export async function exerciseViewportOrientation(page, selector = '#viewport') {
  const original = page.viewportSize()
  if (!original) throw new Error('Viewport emulation is disabled')
  const initial = await viewportSnapshot(page, selector)
  const portrait = original.width <= original.height
    ? { ...original }
    : { width: original.height, height: original.width }
  const landscape = { width: portrait.height, height: portrait.width }

  const landscapeState = await setViewportAndVerify(page, landscape, selector, initial.selectedAssembly)
  const portraitState = await setViewportAndVerify(page, portrait, selector, initial.selectedAssembly)
  if (original.width !== portrait.width || original.height !== portrait.height) {
    await setViewportAndVerify(page, original, selector, initial.selectedAssembly)
  }

  return {
    original,
    landscape: { width: landscapeState.innerWidth, height: landscapeState.innerHeight },
    portrait: { width: portraitState.innerWidth, height: portraitState.innerHeight },
    selectedAssembly: initial.selectedAssembly,
  }
}

export async function exercisePinchZoom(page, selector = '#viewport') {
  const canvas = page.locator(selector)
  await waitForAnimationFrames(page, 4)
  const box = await canvas.boundingBox()
  if (!box || box.width < 120 || box.height < 120) throw new Error('Canvas is too small for pinch verification')

  const before = await canvas.screenshot({ animations: 'disabled' })
  const beforeSha256 = sha256(before)
  const session = await page.context().newCDPSession(page)
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  const points = spread => [
    { x: centerX - spread, y: centerY, id: 1, force: 1 },
    { x: centerX + spread, y: centerY, id: 2, force: 1 },
  ]

  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(28) })
    for (const spread of [42, 56, 70]) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(spread) })
      await waitForAnimationFrames(page, 1)
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally {
    await session.detach().catch(() => {})
  }

  await waitForAnimationFrames(page, 6)
  const after = await canvas.screenshot({ animations: 'disabled' })
  const afterSha256 = sha256(after)
  if (beforeSha256 === afterSha256) throw new Error('Synthetic multi-touch pinch did not change the rendered viewport')

  return { changed: true, beforeSha256, afterSha256 }
}
