import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { qualifyAssemblyGlb } from './lib/assembly-glb.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.resolve(root, process.argv[2] ?? 'public/assets/saturn-v-education.glb')
const manifestUrl = pathToFileURL(path.join(root, 'public/core/assemblyManifest.js')).href
const { nasaSaturnVAssemblyManifest } = await import(manifestUrl)
if (!fs.existsSync(target)) {
  console.error(`Assembly GLB not found: ${target}`)
  process.exit(2)
}
const result = qualifyAssemblyGlb(fs.readFileSync(target), nasaSaturnVAssemblyManifest)
console.log(JSON.stringify(result, null, 2))
if (result.errors.length) process.exit(1)
