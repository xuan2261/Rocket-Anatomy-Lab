import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('viewer theme and selection clarity stay synchronized across DOM and Three.js', async () => {
  const [styles, workspace, realApp, semantic] = await Promise.all([
    readFile(new URL('../public/styles.css', import.meta.url), 'utf8'),
    readFile(new URL('../public/workspace-ui.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../public/real-app.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../public/core/semantic.js', import.meta.url), 'utf8'),
  ])

  assert.match(styles, /--viewer-scene-bg:\s*#d9e5ef/)
  assert.match(styles, /--viewer-selection:\s*#b45309/)
  assert.match(styles, /:root\[data-theme="dark"\][\s\S]*--viewer-scene-bg:\s*#0b111a/)
  assert.match(styles, /\.tree-row\[data-selected="true"\][\s\S]*box-shadow:/)

  assert.match(workspace, /rocket-anatomy:themechange/)
  assert.match(realApp, /applyViewerTheme/)
  assert.match(realApp, /new THREE\.Box3Helper/)
  assert.match(realApp, /viewerSelectionEmissive/)
  assert.match(realApp, /data-selected-assembly|selectedAssembly/)
  assert.doesNotMatch(realApp, /scene\.background\s*=\s*new THREE\.Color\(0x0b111a\)/)

  assert.match(semantic, /if \(hasSelection\)[\s\S]*return selected \? 1 : 0\.52/)
})
