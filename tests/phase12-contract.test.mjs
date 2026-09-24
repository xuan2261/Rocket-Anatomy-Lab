import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('Phase 12 keeps NASA reference anatomy distinct from GLB geometry', async () => {
  const [html,controller,realApp,docs]=await Promise.all([
    readFile(new URL('../public/index.html',import.meta.url),'utf8'),
    readFile(new URL('../public/anatomy-controller.mjs',import.meta.url),'utf8'),
    readFile(new URL('../public/real-app.mjs',import.meta.url),'utf8'),
    readFile(new URL('../docs/PHASE12_DEEP_ANATOMY.md',import.meta.url),'utf8'),
  ])
  assert.match(html,/data-structure-mode="model"/)
  assert.match(html,/data-structure-mode="anatomy"/)
  assert.match(html,/id="anatomyBreadcrumbs"/)
  assert.match(html,/id="anatomyInspectBtn"/)
  assert.match(controller,/approximate-region/)
  assert.match(controller,/onInspectReference/)
  assert.match(realApp,/focusAnatomyReference/)
  assert.match(docs,/reference anatomy/i)
  assert.match(docs,/does not add hidden internal geometry/i)
})
