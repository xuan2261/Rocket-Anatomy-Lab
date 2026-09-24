import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('Phase 13 anatomy navigation remains a reference layer, not generated geometry', async () => {
  const [controller, realApp, html, docs] = await Promise.all([
    readFile(new URL('../public/anatomy-controller.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../public/real-app.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../docs/PHASE13_ANATOMY_NAVIGATION.md', import.meta.url), 'utf8'),
  ])

  assert.doesNotMatch(controller, /from ['"]three/)
  assert.doesNotMatch(controller, /new\s+THREE\.(?:Mesh|BufferGeometry|BoxGeometry|CylinderGeometry)/)
  assert.match(controller, /history\[method\]\(history\.state/)
  assert.match(controller, /filterAnatomyNodes/)
  assert.match(controller, /updateReferenceMarker/)
  assert.match(realApp, /anatomyReferencePoint/)
  assert.match(realApp, /focusCameraOnReference/)
  assert.match(html, /id="anatomyEvidenceDetails"/)
  assert.match(html, /id="anatomySearchInput"/)
  assert.match(docs, /No reference node creates, clones, or claims internal mesh geometry/i)
})
