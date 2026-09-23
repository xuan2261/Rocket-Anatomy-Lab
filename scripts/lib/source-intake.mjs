import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { githubBlobSha, parseGlb } from './assembly-glb.mjs'

export const qualifySourceGlb = (buffer, manifest) => {
  const errors = []
  const gitSha = githubBlobSha(buffer)
  let parsed = null
  try {
    parsed = parseGlb(buffer)
  } catch (error) {
    errors.push(`invalid GLB: ${error instanceof Error ? error.message : String(error)}`)
  }
  const digest = sha256(buffer)
  if (gitSha !== manifest.source.gitSha) {
    errors.push(`Git blob SHA mismatch: expected ${manifest.source.gitSha}, got ${gitSha}`)
  }
  if (manifest.source.sha256 && digest !== manifest.source.sha256) {
    errors.push(`SHA-256 mismatch: expected ${manifest.source.sha256}, got ${digest}`)
  }
  if (Number.isInteger(manifest.source.byteLength) && buffer.length !== manifest.source.byteLength) {
    errors.push(`byte length mismatch: expected ${manifest.source.byteLength}, got ${buffer.length}`)
  }
  if (parsed?.json?.asset?.version !== '2.0') {
    errors.push(`glTF asset version must be 2.0, got ${parsed?.json?.asset?.version ?? 'missing'}`)
  }
  return {
    errors,
    gitSha,
    sha256: digest,
    byteLength: buffer.length,
    gltfVersion: parsed?.json?.asset?.version ?? null,
    sceneCount: parsed?.json?.scenes?.length ?? 0,
    nodeCount: parsed?.json?.nodes?.length ?? 0,
    meshCount: parsed?.json?.meshes?.length ?? 0,
  }
}

export const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex')

export const atomicWriteFile = (targetPath, buffer) => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  const tempPath = `${targetPath}.tmp-${process.pid}`
  try {
    fs.writeFileSync(tempPath, buffer)
    fs.renameSync(tempPath, targetPath)
  } finally {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true })
  }
}
