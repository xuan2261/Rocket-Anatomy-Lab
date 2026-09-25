import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chromium, devices, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { prepareAcceptance } from './lib/acceptance-config.mjs'

// Read-only acceptance of the deployed app. No local server, request mocks,
// application-state injection, baseline updates, or release operation.
const { revision: REVISION, base: BASE, output: OUTPUT, harnessRevision } = prepareAcceptance()
const ASSEMBLIES = ['base-assembly', 'lower-body-assembly', 'center-body-assembly', 'upper-body-assembly', 'nose-stack-assembly']
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', args, { maxBuffer: 16 * 1024 * 1024 })
const pauseFrames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
console.log(`Acceptance output: ${OUTPUT}`)
const report = {
  expectedApplicationRevision: REVISION, target: BASE, startedAt: new Date().toISOString(),
  harnessRevision, outputMode: 'artifact-only',
  runUrl: process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
  environment: { platform: os.platform(), release: os.release(), node: process.version },
  fingerprints: [], cases: [], infrastructureErrors: [],
  physicalDevices: 'NOT YET VERIFIED', stableRelease: 'NOT AUTHORIZED BY THIS HARNESS',
  limitations: ['Mobile is Chromium Pixel 7 emulation, not a physical Android device.', 'No physical iOS, GPU/driver, pinch gesture or assistive-technology sign-off.', 'Screenshots are unmasked observations; no new golden snapshots are accepted.'],
}

function sourceFiles() {
  const tracked = git('ls-tree', '-r', '--name-only', REVISION, '--', 'public/').toString().trim().split('\n')
    .filter(name => /\.(mjs|html|css|json)$/.test(name))
    .map(name => ({ name, bytes: git('show', `${REVISION}:${name}`) }))
  function collect(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = path.join(dir, item.name)
      if (item.isDirectory()) collect(name)
      else if (name.endsWith('.js')) tracked.push({ name: name.split(path.sep).join('/'), bytes: fs.readFileSync(name) })
    }
  }
  collect('public/core')
  for (const name of ['public/assets/saturn-v.glb', 'public/assets/saturn-v-education.glb']) {
    tracked.push({ name, bytes: fs.readFileSync(name) })
  }
  return tracked
}

async function fingerprint(files, phase) {
  const results = []
  for (const file of files) {
    const url = new URL(file.name.slice('public/'.length), BASE).href
    const response = await fetch(url, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(30_000), redirect: 'error' })
    if (!response.ok) throw new Error(`${phase}: HTTP ${response.status}: ${url}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    const result = { path: file.name, bytes: bytes.length, expectedSha256: sha256(file.bytes), actualSha256: sha256(bytes) }
    result.matches = result.expectedSha256 === result.actualSha256
    results.push(result)
  }
  report.fingerprints.push({ phase, at: new Date().toISOString(), files: results })
  const bad = results.filter(item => !item.matches)
  if (bad.length) throw new Error(`${phase}: deployed byte mismatch: ${bad.map(item => item.path).join(', ')}`)
  console.log(`FINGERPRINT ${phase}: ${results.length}/${results.length} exact byte matches`)
}

const profiles = [
  { name: 'desktop', mobile: false, options: { ...devices['Desktop Chrome'], userAgent: undefined, viewport: { width: 1280, height: 720 } } },
  { name: 'mobile-emulated', mobile: true, options: { ...devices['Pixel 7'] } },
]
let browser
let expectedByUrl

async function runCase(profile, language, suffix, fn) {
  const id = `${profile.name}-${language}-${suffix}`
  const result = { id, status: 'RUNNING', startedAt: new Date().toISOString(), input: profile.mobile ? 'emulated touch taps + native keyboard range' : 'mouse + native keyboard', errors: [], warnings: [], requestsFailed: [], screenshots: [], browserFiles: [] }
  report.cases.push(result)
  const context = await browser.newContext({ ...profile.options, reducedMotion: 'reduce', colorScheme: 'light', locale: language === 'vi' ? 'vi-VN' : 'en-US' })
  const page = await context.newPage()
  page.setDefaultTimeout(15_000)
  page.setDefaultNavigationTimeout(45_000)
  const bodies = []
  page.on('pageerror', error => result.errors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') result.errors.push(`console: ${message.text()}`)
    else if (message.type() === 'warning') result.warnings.push(message.text())
  })
  page.on('requestfailed', request => result.requestsFailed.push({ url: request.url(), failure: request.failure()?.errorText }))
  page.on('response', response => {
    const expected = expectedByUrl.get(response.url())
    if (!expected) return
    if (!response.ok()) {
      result.errors.push(`HTTP ${response.status()}: ${response.url()}`)
      return
    }
    bodies.push(response.body().then(bytes => {
      const actual = sha256(bytes)
      result.browserFiles.push({ url: response.url(), sha256: actual, matches: actual === expected })
      if (actual !== expected) result.errors.push(`Browser received a different file: ${response.url()}`)
    }).catch(error => result.errors.push(`Cannot fingerprint browser response ${response.url()}: ${error.message}`)))
  })
  await context.tracing.start({ screenshots: true, snapshots: true })
  const act = (locator, options = {}) => profile.mobile ? locator.tap(options) : locator.click(options)
  const panel = async name => {
    await act(page.locator(`[data-control-tab="${name}"]`))
    await expect(page.locator(`[data-control-tab="${name}"]`)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator(`[data-control-pane="${name}"]`)).toBeVisible()
  }
  const shot = async name => {
    await pauseFrames(page)
    const filename = `${id}-${name}.png`
    await page.screenshot({ path: path.join(OUTPUT, filename), animations: 'disabled', fullPage: true })
    result.screenshots.push(filename)
  }
  try {
    await fn({ page, act, panel, shot, result })
    await pauseFrames(page)
    await Promise.all(bodies)
    expect(result.errors, `${id}: runtime/source errors`).toEqual([])
    expect(result.requestsFailed, `${id}: failed network requests`).toEqual([])
    result.status = 'PASS'
  } catch (error) {
    result.status = 'FAIL'
    result.failure = String(error.stack ?? error)
    await shot('failure').catch(() => {})
  } finally {
    result.finishedAt = new Date().toISOString()
    result.durationMs = Date.parse(result.finishedAt) - Date.parse(result.startedAt)
    await context.tracing.stop(result.status === 'FAIL' ? { path: path.join(OUTPUT, `${id}-trace.zip`) } : {}).catch(() => {})
    await context.close()
    console.log(`${result.status}: ${id} (${result.durationMs}ms)${result.failure ? `\n${result.failure}` : ''}`)
    fs.writeFileSync(path.join(OUTPUT, 'results.json'), JSON.stringify(report, null, 2))
  }
}

async function load(page, language, assembly) {
  const url = new URL(BASE)
  url.searchParams.set('lang', language)
  url.searchParams.set('lesson', assembly)
  const response = await page.goto(url.href)
  expect(response?.status()).toBe(200)
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 45_000 })
  await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', assembly)
  await expect(page.locator('html')).toHaveAttribute('lang', language)
}

async function checkNoDocumentOverflow(page) {
  expect(await page.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    vertical: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
  }))).toEqual({ horizontal: false, vertical: false })
}

try {
  const files = sourceFiles()
  expectedByUrl = new Map(files.map(file => [new URL(file.name.slice(7), BASE).href, sha256(file.bytes)]))
  await fingerprint(files, 'before')
  browser = await chromium.launch({ headless: true })
  report.environment.browser = browser.version()
  for (const profile of profiles) {
    for (const language of ['vi', 'en']) {
      for (const [index, assembly] of ASSEMBLIES.entries()) {
        await runCase(profile, language, assembly, async ({ page, act, panel, shot, result }) => {
          await load(page, language, assembly)
          result.userAgent = await page.evaluate(() => navigator.userAgent)
          result.viewport = page.viewportSize()
          await page.reload()
          await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 45_000 })
          await expect(page.locator('#viewport')).toHaveAttribute('data-selected-assembly', assembly)
          expect(new URL(page.url()).searchParams.get('lesson')).toBe(assembly)
          expect(new URL(page.url()).searchParams.get('lang')).toBe(language)
          const canvas = page.locator('#viewport')
          await panel('objects')
          const row = id => page.locator(`#tree [data-assembly-id="${id}"]`)
          await act(row(assembly).locator('.tree-select'))
          await expect(row(assembly)).toHaveAttribute('aria-selected', 'true')
          await panel('learning')
          const annotation = page.locator('#learningAnnotationsBtn')
          if (await annotation.getAttribute('aria-pressed') === 'true') await act(annotation)
          await expect(annotation).toHaveAttribute('aria-pressed', 'false')
          await act(page.locator('#learningFocusBtn'))
          await pauseFrames(page)
          await panel('objects')
          await act(row(ASSEMBLIES[(index + 1) % ASSEMBLIES.length]).locator('.tree-select'))
          await expect(page.locator('#tree input[type="checkbox"]:checked')).toHaveCount(5)
          const box = await canvas.boundingBox()
          expect(box).not.toBeNull()
          await act(canvas, { position: { x: box.width / 2, y: box.height / 2 } })
          await expect(canvas).toHaveAttribute('data-selected-assembly', assembly)
          result.singleCanvasPick = true
          await panel('view')
          await expect(canvas).toHaveAttribute('data-view-mode', 'normal')
          if (assembly === 'center-body-assembly' && language === 'vi') await shot('normal')
          for (const mode of ['ghost', 'xray', 'normal']) {
            await act(page.locator(`[data-mode="${mode}"]`))
            await expect(canvas).toHaveAttribute('data-view-mode', mode)
            if (assembly === 'center-body-assembly' && language === 'vi' && mode !== 'normal') await shot(mode)
          }
          for (const amount of [50, 100, 0]) {
            const slider = page.locator('#explodeSlider')
            await slider.focus()
            await slider.press('Home')
            if (amount === 100) await slider.press('End')
            if (amount === 50) for (let i = 0; i < 5; i++) await slider.press('PageUp')
            await expect(slider).toHaveValue(String(amount))
            await expect(canvas).toHaveAttribute('data-explode-percent', String(amount))
          }
          for (const theme of ['dark', 'light']) {
            await act(page.locator(`[data-theme-value="${theme}"]`))
            await expect(canvas).toHaveAttribute('data-viewer-theme', theme)
          }
          await panel('objects')
          await act(page.locator('#isolateBtn'))
          await expect(canvas).toHaveAttribute('data-isolated-assembly', assembly)
          await act(page.locator('#isolateBtn'))
          await expect(canvas).toHaveAttribute('data-isolated-assembly', '')
          await act(page.locator('#hideBtn'))
          await expect(row(assembly).locator('input')).not.toBeChecked()
          await expect(canvas).toHaveAttribute('data-selected-assembly', '')
          await act(page.locator('#hideBtn'))
          await expect(row(assembly).locator('input')).toBeChecked()
          await expect(canvas).toHaveAttribute('data-selected-assembly', assembly)
          // Exercise Show all with a genuinely hidden context assembly.
          const other = row(ASSEMBLIES[(index + 1) % ASSEMBLIES.length]).locator('input')
          await act(other)
          await expect(other).not.toBeChecked()
          await act(page.locator('#showAllBtn'))
          await expect(page.locator('#tree input[type="checkbox"]:checked')).toHaveCount(5)
          await checkNoDocumentOverflow(page)
        })
      }
      for (const theme of ['light', 'dark']) {
        await runCase(profile, language, `guide-${theme}`, async ({ page, act, panel, shot, result }) => {
          await load(page, language, 'center-body-assembly')
          await act(page.locator(`[data-theme-value="${theme}"]`))
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
          await panel('help')
          await expect(page.locator('#paneHelp .help-card')).toHaveCount(7)
          await expect(page.locator('#paneHelp h2')).toHaveText(language === 'vi' ? 'Bắt đầu nhanh với Rocket Anatomy Lab' : 'Quick start with Rocket Anatomy Lab')
          await expect(page.locator('#helpDocsLink')).toHaveAttribute('href', 'https://github.com/xuan2261/Rocket-Anatomy-Lab/blob/main/docs/USER_GUIDE.md')
          await checkNoDocumentOverflow(page)
          result.tabTargets = await page.locator('[data-control-tab]').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { tab: node.dataset.controlTab, width: r.width, height: r.height, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth } }))
          for (const target of result.tabTargets) {
            expect(target.height).toBeGreaterThanOrEqual(profile.mobile ? 48 : 44)
            expect(target.width).toBeGreaterThanOrEqual(profile.mobile ? 48 : 44)
            expect(target.scrollWidth).toBeLessThanOrEqual(target.clientWidth + 1)
          }
          if (!profile.mobile) {
            await page.locator('[data-control-tab="objects"]').focus()
            await page.keyboard.press('End')
            await expect(page.locator('[data-control-tab="help"]')).toBeFocused()
            await page.keyboard.press('Tab')
            await expect(page.locator('#paneHelp')).toBeFocused()
          }
          const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
          result.axe = { violations: axe.violations, incomplete: axe.incomplete.map(item => item.id), passes: axe.passes.length }
          expect(axe.violations).toEqual([])
          await shot('live')
        })
      }
    }
  }
  await fingerprint(files, 'after')
} catch (error) {
  report.infrastructureErrors.push(String(error.stack ?? error))
  console.error(error)
} finally {
  if (browser) await browser.close()
  report.finishedAt = new Date().toISOString()
  const failed = report.cases.filter(item => item.status !== 'PASS')
  report.totals = { expectedCases: 28, executed: report.cases.length, passed: report.cases.filter(item => item.status === 'PASS').length, failed: failed.length }
  report.status = !report.infrastructureErrors.length && !failed.length && report.cases.length === 28 ? 'PASS' : 'FAIL'
  fs.writeFileSync(path.join(OUTPUT, 'results.json'), JSON.stringify(report, null, 2))
  const lines = [
    '# Production browser acceptance', '', `Result: **${report.status}**`, '',
    `Application revision: \`${REVISION}\``, `Live target: ${BASE}`, `Run: ${report.runUrl ?? 'local'}`, '',
    'This checks deployed resources and real browser interactions against GitHub Pages. No local preview or mocked assets are used.', '',
    `Cases: ${report.totals.passed}/${report.totals.expectedCases} passed; ${report.totals.failed} failed.`, '',
    '**Physical Android/iOS: NOT YET VERIFIED.** Pixel 7 is Chromium emulation. No stable release is authorized by this result.', '',
    '| Case | Status | Duration (ms) |', '| --- | --- | --- |',
    ...report.cases.map(item => `| ${item.id} | ${item.status} | ${item.durationMs} |`), '',
    '## Resource identity', ...report.fingerprints.map(item => `- ${item.phase}: ${item.files.filter(file => file.matches).length}/${item.files.length} files byte-identical to the pinned revision/build.`), '',
    '## Limitations', ...report.limitations.map(item => `- ${item}`), '',
    '## Errors', ...report.infrastructureErrors.map(item => `\`\`\`text\n${item}\n\`\`\``),
    ...failed.map(item => `### ${item.id}\n\`\`\`text\n${item.failure}\n\`\`\``), '',
    '## Unmasked screenshots', ...report.cases.flatMap(item => item.screenshots.map(name => `![${name}](${name})`)), '',
  ]
  fs.writeFileSync(path.join(OUTPUT, 'README.md'), lines.join('\n'))
  console.log('ACCEPTANCE_SUMMARY ' + JSON.stringify({ status: report.status, ...report.totals, physicalDevices: report.physicalDevices }))
  if (report.status !== 'PASS') process.exitCode = 1
}
