import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const REPOSITORY = 'xuan2261/Rocket-Anatomy-Lab'
const LIVE_URL = `https://xuan2261.github.io/Rocket-Anatomy-Lab/`
const contains = (parent, child) => {
  const relative = path.relative(parent, child)
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
}

// No network calls or mutations on import. Only a new job-local output directory
// is created after all revision, source and destination checks have passed.
export function prepareAcceptance({ cwd = process.cwd(), env = process.env } = {}) {
  const git = (...args) => execFileSync('git', args, {
    cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
  const root = fs.realpathSync(git('rev-parse', '--show-toplevel'))
  if (fs.realpathSync(cwd) !== root) throw new Error('Run acceptance from the repository root')
  const harnessRevision = git('rev-parse', '--verify', 'HEAD^{commit}')
  if (env.GITHUB_ACTIONS === 'true' && (
    env.GITHUB_REPOSITORY !== REPOSITORY || env.GITHUB_REF !== 'refs/heads/main' ||
    env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || env.GITHUB_SHA !== harnessRevision
  )) throw new Error('GitHub acceptance requires workflow_dispatch on the exact main checkout')

  const revision = (env.ACCEPTANCE_REVISION?.trim() || harnessRevision).toLowerCase()
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Expected revision must be a full 40 hexadecimal commit SHA')
  try {
    git('rev-parse', '--verify', `${revision}^{commit}`)
    git('merge-base', '--is-ancestor', revision, harnessRevision)
  } catch {
    throw new Error('Expected revision must exist and be an ancestor of the checked-out commit')
  }
  const drift = git('diff', revision, '--', 'public', 'src', 'package.json', 'tsconfig.json')
  if (drift) throw new Error('Application source differs from the acceptance revision')

  const requested = path.resolve(env.ACCEPTANCE_OUTPUT_DIR || path.join(os.tmpdir(), `rocket-acceptance-${randomUUID()}`))
  // Resolve the parent to reject symlink aliases into source or archived evidence.
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested))
  if (contains(root, output) || contains(output, root)) throw new Error('Acceptance output must be outside the repository and its ancestors')
  if (fs.existsSync(output)) throw new Error('Acceptance output already exists; choose a fresh directory')
  fs.mkdirSync(output)
  return { revision, harnessRevision, output, base: LIVE_URL }
}
