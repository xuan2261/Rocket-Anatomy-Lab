import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { reauthorAssemblyGlb } from './lib/assembly-glb.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = path.resolve(root, process.argv[2] ?? 'public/assets/saturn-v.glb')
const output = path.resolve(root, process.argv[3] ?? 'public/assets/saturn-v-education.glb')
const manifestUrl = pathToFileURL(path.join(root, 'public/core/assemblyManifest.js')).href
const { nasaSaturnVAssemblyManifest } = await import(manifestUrl)

if (!fs.existsSync(input)) {
  console.error(`Source GLB not found: ${input}`)
  console.error('Place the pinned NASA Saturn V.glb at public/assets/saturn-v.glb, then rerun this command.')
  process.exit(2)
}

const source = fs.readFileSync(input)
const { output: result, summary } = reauthorAssemblyGlb(source, nasaSaturnVAssemblyManifest)
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, result)
const reportPath = path.join(root, 'docs', 'assembly-build-report.json')
fs.writeFileSync(reportPath, `${JSON.stringify({ input, output, ...summary }, null, 2)}\n`)
console.log(JSON.stringify({ output, reportPath, ...summary }, null, 2))
