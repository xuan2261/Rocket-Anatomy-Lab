import path from 'node:path'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestUrl = pathToFileURL(path.join(root, 'public/core/detailAssets.js')).href
const { qualifiedDetailAssets, validateDetailAssetManifest } = await import(manifestUrl)

const manifestErrors = validateDetailAssetManifest(qualifiedDetailAssets)
if (manifestErrors.length) {
  console.error(JSON.stringify({ status: 'INVALID_DETAIL_MANIFEST', errors: manifestErrors }, null, 2))
  process.exit(2)
}

const gitBlobSha = buffer => {
  const prefix = Buffer.from(`blob ${buffer.length}\0`)
  return createHash('sha1').update(prefix).update(buffer).digest('hex')
}

const qualifyGlb = (buffer, asset) => {
  const errors = []
  if (buffer.length !== asset.byteLength) errors.push(`byteLength expected ${asset.byteLength}, got ${buffer.length}`)
  if (buffer.length < 12) errors.push('GLB smaller than 12-byte header')
  else {
    if (buffer.toString('ascii', 0, 4) !== 'glTF') errors.push('invalid GLB magic')
    const version = buffer.readUInt32LE(4)
    const declaredLength = buffer.readUInt32LE(8)
    if (version !== 2) errors.push(`GLB version expected 2, got ${version}`)
    if (declaredLength !== buffer.length) errors.push(`GLB declared length ${declaredLength} != actual ${buffer.length}`)
  }
  const actualBlobSha = gitBlobSha(buffer)
  if (actualBlobSha !== asset.gitBlobSha) errors.push(`git blob SHA expected ${asset.gitBlobSha}, got ${actualBlobSha}`)
  return { errors, actualBlobSha }
}

const fetchPinned = async asset => {
  const attempts = []
  for (const url of [asset.officialDownloadUrl, asset.githubRawUrl]) {
    try {
      const response = await fetch(url, { redirect: 'follow' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      const qualification = qualifyGlb(buffer, asset)
      attempts.push({ url, ok: qualification.errors.length === 0, byteLength: buffer.length, ...qualification })
      if (qualification.errors.length === 0) return { url, buffer, attempts }
    } catch (error) {
      attempts.push({ url, ok: false, error: error instanceof Error ? error.message : String(error) })
    }
  }
  throw new Error(JSON.stringify({ assetId: asset.id, attempts }))
}

const results = []
for (const asset of qualifiedDetailAssets) {
  try {
    const accepted = await fetchPinned(asset)
    const target = path.join(root, 'public', asset.localUrl.replace(/^\.\//, ''))
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, accepted.buffer)
    results.push({
      id: asset.id,
      status: 'PASS',
      sourceUrl: accepted.url,
      target: path.relative(root, target).replaceAll('\\', '/'),
      byteLength: accepted.buffer.length,
      gitBlobSha: asset.gitBlobSha,
      attempts: accepted.attempts,
    })
  } catch (error) {
    results.push({
      id: asset.id,
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const failed = results.filter(result => result.status !== 'PASS')
console.log(JSON.stringify({ status: failed.length ? 'FAIL' : 'PASS', results }, null, 2))
if (failed.length) process.exit(2)
