import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('Phase 15 real detail is fetched fail-closed and loaded locally on demand', async () => {
  const [fetcher, loader, controller, realApp, html, docs] = await Promise.all([
    readFile(new URL('../scripts/fetch-detail-assets.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../public/real-detail-loader.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../public/anatomy-controller.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../public/real-app.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../docs/PHASE15_QUALIFIED_DETAIL_ASSETS.md', import.meta.url), 'utf8'),
  ])

  assert.match(fetcher, /gitBlobSha/)
  assert.match(fetcher, /invalid GLB magic/)
  assert.match(fetcher, /declared length/)
  assert.match(fetcher, /process\.exit\(2\)/)

  assert.match(loader, /detailAssetForNode/)
  assert.match(loader, /loader\.loadAsync\(asset\.localUrl\)/)
  assert.doesNotMatch(loader, /assets\.science\.nasa\.gov|raw\.githubusercontent\.com/)
  assert.match(loader, /isQualifiedRealDetail/)
  assert.match(loader, /setSectionEnabled/)
  assert.match(loader, /disposeObject/)

  assert.match(controller, /anatomyLoadRealDetailBtn/)
  assert.match(controller, /onLoadRealDetail/)
  assert.match(realApp, /createRealDetailLoader/)
  assert.match(realApp, /loadRealDetailForAnatomy/)
  assert.match(realApp, /state = setMode\(state, 'ghost'\)/)
  assert.match(html, /id="anatomyRealDetailCard"/)
  assert.match(docs, /placement\/scale mapping.*approximate educational anchor/i)
})
