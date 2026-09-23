import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { qualifyAssemblyGlb, reauthorAssemblyGlb } from './lib/assembly-glb.mjs'
import { atomicWriteFile, qualifySourceGlb, sha256 } from './lib/source-intake.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(root, 'public', 'assets', 'saturn-v.glb')
const outputPath = path.join(root, 'public', 'assets', 'saturn-v-education.glb')
const reportPath = path.join(root, 'docs', 'phase3b-real-asset-qualification.json')
const manifestUrl = pathToFileURL(path.join(root, 'public/core/assemblyManifest.js')).href
const { nasaSaturnVAssemblyManifest } = await import(manifestUrl)

const writeReport = report => fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)

if (!fs.existsSync(sourcePath)) {
  const report = {
    status: 'BLOCKED_INPUT',
    reason: 'Pinned official NASA source GLB is not present in public/assets.',
    requiredPath: sourcePath,
    requiredGitBlobSha: nasaSaturnVAssemblyManifest.source.gitSha,
    requiredSha256: nasaSaturnVAssemblyManifest.source.sha256,
    requiredByteLength: nasaSaturnVAssemblyManifest.source.byteLength,
  }
  writeReport(report)
  console.error(JSON.stringify(report, null, 2))
  process.exit(2)
}

const source = fs.readFileSync(sourcePath)
const sourceQualification = qualifySourceGlb(source, nasaSaturnVAssemblyManifest)
if (sourceQualification.errors.length) {
  const report = { status: 'SOURCE_REJECTED', sourcePath, sourceQualification }
  writeReport(report)
  console.error(JSON.stringify(report, null, 2))
  process.exit(3)
}

let result
try {
  result = reauthorAssemblyGlb(source, nasaSaturnVAssemblyManifest)
} catch (error) {
  const report = {
    status: 'REAUTHOR_FAILED',
    sourcePath,
    sourceQualification,
    error: error instanceof Error ? error.message : String(error),
  }
  writeReport(report)
  console.error(JSON.stringify(report, null, 2))
  process.exit(4)
}

const outputQualification = qualifyAssemblyGlb(result.output, nasaSaturnVAssemblyManifest)
const status = outputQualification.errors.length ? 'OUTPUT_REJECTED' : 'PASS'
const report = {
  status,
  source: {
    path: sourcePath,
    sha256: sha256(source),
    ...sourceQualification,
  },
  output: {
    path: outputPath,
    byteLength: result.output.length,
    sha256: sha256(result.output),
    qualification: outputQualification,
  },
  summary: result.summary,
}
writeReport(report)
if (status !== 'PASS') {
  console.error(JSON.stringify(report, null, 2))
  process.exit(5)
}
atomicWriteFile(outputPath, result.output)
console.log(JSON.stringify(report, null, 2))
