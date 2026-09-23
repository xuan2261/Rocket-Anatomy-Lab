import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const intake = fs.readFileSync(new URL('../scripts/intake-source-glb.mjs', import.meta.url), 'utf8')
const gate = fs.readFileSync(new URL('../scripts/phase3b-real-asset-gate.mjs', import.meta.url), 'utf8')

test('Phase 3B intake verifies the pinned source before atomic copy', () => {
  assert.match(intake, /qualifySourceGlb/)
  assert.match(intake, /atomicWriteFile/)
  assert.match(intake, /REJECTED/)
  assert.doesNotMatch(intake, /copyFileSync\([^)]*\)\s*;?\s*const qualification/)
})

test('Phase 3B one-shot gate is fail-closed and records provenance', () => {
  assert.match(gate, /BLOCKED_INPUT/)
  assert.match(gate, /SOURCE_REJECTED/)
  assert.match(gate, /REAUTHOR_FAILED/)
  assert.match(gate, /OUTPUT_REJECTED/)
  assert.match(gate, /sha256/)
  assert.match(gate, /qualifyAssemblyGlb/)
  assert.match(gate, /atomicWriteFile/)
})

test('tree visibility toggles expose a 44px wrapper target instead of enlarging the checkbox itself', () => {
  const real = fs.readFileSync(new URL('../public/real-app.mjs', import.meta.url), 'utf8')
  const fallback = fs.readFileSync(new URL('../public/fallback-app.mjs', import.meta.url), 'utf8')
  const css = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8')
  assert.match(real, /tree-toggle-target/)
  assert.match(fallback, /tree-toggle-target/)
  assert.match(css, /\.tree-toggle-target\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s)
  assert.match(css, /\.tree-row input\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/s)
})

test('Phase 3B pins official source URLs plus SHA-256 and byte length', () => {
  const manifest = fs.readFileSync(new URL('../src/assemblyManifest.ts', import.meta.url), 'utf8')
  const fetcher = fs.readFileSync(new URL('../scripts/fetch-official-source.mjs', import.meta.url), 'utf8')
  assert.match(manifest, /6c44497bce54ee0b09d0edb8e33a6f484762a320dab1c54b383e434f5bba06b5/)
  assert.match(manifest, /byteLength:\s*927212/)
  assert.match(manifest, /assets\.science\.nasa\.gov/)
  assert.match(manifest, /raw\.githubusercontent\.com/)
  assert.match(fetcher, /BLOCKED_NETWORK_OR_SOURCE/)
  assert.match(fetcher, /qualifySourceGlb/)
  assert.match(fetcher, /atomicWriteFile/)
})
