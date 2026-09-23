import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

function makeGlb(json) {
  const raw = Buffer.from(JSON.stringify(json), 'utf8')
  const pad = (4 - (raw.length % 4)) % 4
  const jsonChunk = Buffer.concat([raw, Buffer.alloc(pad, 0x20)])
  const out = Buffer.alloc(12 + 8 + jsonChunk.length)
  out.write('glTF', 0, 'ascii')
  out.writeUInt32LE(2, 4)
  out.writeUInt32LE(out.length, 8)
  out.writeUInt32LE(jsonChunk.length, 12)
  out.writeUInt32LE(0x4e4f534a, 16)
  jsonChunk.copy(out, 20)
  return out
}

test('GLB inspector reports semantic manifest requirement for generic node names', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'glb-inspector-'))
  const file = join(dir, 'fixture.glb')
  await writeFile(file, makeGlb({
    asset: { version: '2.0' },
    scenes: [{ nodes: [2] }],
    nodes: [
      { name: 'pCylinder1', mesh: 0 },
      { name: 'polySurfa1', mesh: 1 },
      { name: 'root', children: [0,1] }
    ],
    meshes: [{},{}],
    materials: [{}]
  }))
  const { stdout } = await execFileAsync(process.execPath, ['scripts/inspect-glb.mjs', file], {
    cwd: new URL('..', import.meta.url).pathname
  })
  const report = JSON.parse(stdout)
  assert.equal(report.counts.nodes, 3)
  assert.equal(report.counts.meshes, 2)
  assert.equal(report.semanticNaming, 'weak')
  assert.equal(report.verdict, 'needs-semantic-manifest')
})
