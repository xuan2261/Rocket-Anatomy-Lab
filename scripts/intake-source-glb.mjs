import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { atomicWriteFile, qualifySourceGlb, sha256 } from './lib/source-intake.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestUrl = pathToFileURL(path.join(root, 'public/core/assemblyManifest.js')).href
const { nasaSaturnVAssemblyManifest } = await import(manifestUrl)

const inputArg = process.argv[2]
if (!inputArg) {
  console.error('Usage: node scripts/intake-source-glb.mjs <path-to-official-saturn-v.glb>')
  process.exit(2)
}
const input = path.resolve(process.cwd(), inputArg)
const target = path.join(root, 'public', 'assets', 'saturn-v.glb')
const reportPath = path.join(root, 'docs', 'source-intake-report.json')
if (!fs.existsSync(input)) {
  console.error(`Input GLB not found: ${input}`)
  process.exit(2)
}
const buffer = fs.readFileSync(input)
const qualification = qualifySourceGlb(buffer, nasaSaturnVAssemblyManifest)
const report = {
  status: qualification.errors.length ? 'REJECTED' : 'VERIFIED',
  input,
  target,
  sourceSha256: sha256(buffer),
  expectedGitBlobSha: nasaSaturnVAssemblyManifest.source.gitSha,
  expectedSha256: nasaSaturnVAssemblyManifest.source.sha256,
  expectedByteLength: nasaSaturnVAssemblyManifest.source.byteLength,
  ...qualification,
}
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
if (qualification.errors.length) {
  console.error(JSON.stringify(report, null, 2))
  process.exit(3)
}
atomicWriteFile(target, buffer)
console.log(JSON.stringify({ ...report, copied: true, reportPath }, null, 2))
