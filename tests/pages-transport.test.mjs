import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const pages = fs.readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8')
const promote = pages.slice(pages.indexOf('\n  promote:'), pages.indexOf('\n  deploy:'))
const upload = promote.slice(promote.indexOf('      - name: Forward the identical tar'))

test('Pages transport uses the official uploader default compression, not a stored ZIP', () => {
  assert.match(upload, /uses: actions\/upload-artifact@v7/)
  assert.match(upload, /compression-level: 6\b/)
  assert.doesNotMatch(upload, /archive: false|compression-level: 0\b/)
})

test('changing the transport envelope must never repack or rebuild the tested tar', () => {
  assert.match(upload, /path: \$\{\{ runner.temp \}\}\/tested-site\/artifact\.tar/)
  assert.doesNotMatch(promote, /uses: actions\/upload-pages-artifact|run: .*\btar\b|npm run (build|verify)/)
  assert.match(pages, /SITE_TAR_SHA256: \$\{\{ needs.promote.outputs.tar_sha256 \}\}/)
  assert.match(pages, /run: python3 scripts\/site_artifact.py hash/)
})
