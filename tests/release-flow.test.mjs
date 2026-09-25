import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import net from 'node:net'
import { spawn } from 'node:child_process'

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')
const ci = read('.github/workflows/ci.yml')
const pages = read('.github/workflows/pages.yml')
const job = (yaml, id) => yaml.match(new RegExp(`^  ${id}:\\n([\\s\\S]*?)(?=^  [\\w-]+:|$(?![\\s\\S]))`, 'm'))?.[1] ?? ''

test('only the qualified Node 22 matrix result is packaged as the candidate', () => {
  const verify = job(ci, 'verify')
  assert.match(verify, /node: \[22, 24\]/)
  assert.match(verify, /npm run verify:ci/)
  assert.match(verify, /site_artifact_test\.py/)
  assert.match(verify, /if: matrix.node == 22[\s\S]*site_artifact\.py pack/)
  assert.equal((ci.match(/site_artifact\.py pack/g) ?? []).length, 1)
  assert.match(verify, /site-candidate-\$\{\{ github.sha \}\}-\$\{\{ github.run_id \}\}-\$\{\{ github.run_attempt \}\}/)
})

test('browser lanes serve and verify the same downloaded payload without rebuilding', () => {
  for (const lane of ['e2e', 'visual']) {
    const text = job(ci, lane)
    assert.match(text, /needs: verify/)
    assert.match(text, /actions\/download-artifact@v8/)
    assert.match(text, /digest-mismatch: error/)
    assert.match(text, /ROCKET_PUBLIC_ROOT=.*site-under-test/)
    assert.match(text, new RegExp(`site_artifact\\.py restore[\\s\\S]*npm run test:${lane}[\\s\\S]*site_artifact\\.py proof ${lane}`))
    assert.doesNotMatch(text, /npm run (verify:ci|build|fetch:|build:)|--update-snapshots/)
    const receiptStep = text.slice(text.indexOf('name: Verify served bytes'), text.indexOf('name: Upload successful') )
    assert.doesNotMatch(receiptStep, /always\(\)|continue-on-error/)
  }
})

test('tested artifact publication depends on both byte-bound browser receipts and all qualification jobs', () => {
  const text = job(ci, 'publish')
  assert.match(text, /needs: \[verify, e2e, visual\]/)
  assert.match(text, /site-proof-\*/)
  assert.match(text, /site_artifact\.py certify[\s\S]*tested-site-/)
  assert.doesNotMatch(text, /always\(\)|continue-on-error|overwrite: true/)
})

test('Pages forwards only the original tar and cannot rebuild or repack it', () => {
  assert.doesNotMatch(pages, /run: npm (install|ci|run (build|verify:))|uses: actions\/upload-pages-artifact@/)
  const text = job(pages, 'promote')
  assert.match(text, /artifact-ids: \$\{\{ needs.gate.outputs.site_artifact_id \}\}/)
  assert.match(text, /run-id: \$\{\{ needs.gate.outputs.ci_run_id \}\}/)
  assert.match(text, /digest-mismatch: error/)
  assert.match(text, /site_artifact\.py verify/)
  assert.match(text, /path: \$\{\{ runner.temp \}\}\/tested-site\/artifact.tar/)
  assert.match(job(pages, 'deploy'), /site_artifact\.py hash[\s\S]*node scripts\/check-pages-ci\.mjs[\s\S]*actions\/deploy-pages@/)
  assert.match(job(pages, 'deploy'), /EXPECTED_SITE_ARTIFACT_ID:/)
  assert.match(job(pages, 'smoke'), /site_artifact\.py live/)
})

test('the local server actually serves the specified extracted directory, not repository public', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocket-server-test-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  fs.writeFileSync(path.join(dir, 'index.html'), 'unique-artifact-payload')
  const probe = net.createServer()
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  const child = spawn(process.execPath, ['scripts/serve-local.mjs'], {
    cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: String(port), ROCKET_PUBLIC_ROOT: dir },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  t.after(() => child.kill())
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('server did not start')), 5000)
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`server exited ${code}`)) })
    child.stdout.on('data', data => {
      if (data.toString().includes('Rocket Anatomy Lab:')) { clearTimeout(timeout); resolve() }
    })
  })
  assert.equal(await (await fetch(`http://127.0.0.1:${port}/`)).text(), 'unique-artifact-payload')
  assert.equal((await fetch(`http://127.0.0.1:${port}/bootstrap.mjs`)).status, 404)
})
