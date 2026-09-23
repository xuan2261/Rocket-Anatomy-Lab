import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)

test('Phase 1 HTML pins Three.js and boots through the resilient loader', async () => {
  const html = await readFile(new URL('public/index.html', root), 'utf8')
  assert.match(html, /three@0\.186\.0/)
  assert.match(html, /bootstrap\.mjs/)
  assert.doesNotMatch(html, /src="\.\/app\.mjs"/)
})

test('real renderer keeps Phase 1 GLTFLoader/NASA invariants while Phase 2 owns semantic mapping', async () => {
  const source = await readFile(new URL('public/real-app.mjs', root), 'utf8')
  assert.match(source, /GLTFLoader/)
  assert.match(source, /assets\.science\.nasa\.gov/)
  assert.match(source, /nasaSaturnVCuratedManifest/)
  assert.match(source, /validateCuratedCoverage/)
  assert.match(source, /pagehide/)
})

test('bootstrap retains an explicit offline fallback path', async () => {
  const source = await readFile(new URL('public/bootstrap.mjs', root), 'utf8')
  assert.match(source, /renderer.*fallback/s)
  assert.match(source, /fallback-app\.mjs/)
})
