import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { atomicWriteFile, qualifySourceGlb } from './lib/source-intake.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestUrl = pathToFileURL(path.join(root, 'public/core/assemblyManifest.js')).href
const { nasaSaturnVAssemblyManifest } = await import(manifestUrl)
const target = path.join(root, 'public', 'assets', 'saturn-v.glb')
const reportPath = path.join(root, 'docs', 'fetch-source-report.json')

const candidates = [
  nasaSaturnVAssemblyManifest.source.officialDownloadUrl,
  nasaSaturnVAssemblyManifest.source.githubRawUrl,
].filter(Boolean)

const attempts = []
let accepted = null
for (const url of candidates) {
  try {
    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const qualification = qualifySourceGlb(buffer, nasaSaturnVAssemblyManifest)
    attempts.push({ url, ok: qualification.errors.length === 0, qualification })
    if (!qualification.errors.length) {
      accepted = { url, buffer, qualification }
      break
    }
  } catch (error) {
    attempts.push({ url, ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

const fs = await import('node:fs')
if (!accepted) {
  const report = {
    status: 'BLOCKED_NETWORK_OR_SOURCE',
    expected: {
      gitBlobSha: nasaSaturnVAssemblyManifest.source.gitSha,
      sha256: nasaSaturnVAssemblyManifest.source.sha256,
      byteLength: nasaSaturnVAssemblyManifest.source.byteLength,
    },
    attempts,
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.error(JSON.stringify(report, null, 2))
  process.exit(2)
}

atomicWriteFile(target, accepted.buffer)
const report = {
  status: 'PASS',
  sourceUrl: accepted.url,
  target,
  qualification: accepted.qualification,
  attempts,
}
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
