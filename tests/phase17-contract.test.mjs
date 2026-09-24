import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('Phase 17 inspector keeps picking and part controls inside the qualified visualization layer', async()=>{
  const [loader,controller,realApp,html,docs]=await Promise.all([
    readFile(new URL('../public/real-detail-loader.mjs',import.meta.url),'utf8'),
    readFile(new URL('../public/anatomy-controller.mjs',import.meta.url),'utf8'),
    readFile(new URL('../public/real-app.mjs',import.meta.url),'utf8'),
    readFile(new URL('../public/index.html',import.meta.url),'utf8'),
    readFile(new URL('../docs/PHASE17_DETAIL_PACKAGE_INSPECTOR.md',import.meta.url),'utf8'),
  ])

  assert.match(loader,/new THREE\.BoxHelper/)
  assert.match(loader,/pickPart = raycaster/)
  assert.match(loader,/getPartStats/)
  assert.match(loader,/setGhostOtherParts/)
  assert.match(loader,/setOnlyPartVisible/)
  assert.match(controller,/detailInspectorStateFromSearch/)
  assert.match(controller,/detailInspectorSearch/)
  assert.match(controller,/selectRealDetailPart/)
  assert.match(realApp,/realDetailLoader\?\.pickPart/)
  assert.match(realApp,/canvas\.addEventListener\('pointermove'/)
  assert.match(html,/id="anatomyPartInspector"/)
  assert.match(html,/id="anatomyPartFocusBtn"/)
  assert.match(docs,/does not alter source geometry/i)
})
