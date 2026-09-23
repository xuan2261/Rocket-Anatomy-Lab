import { nasaSaturnVCuratedManifest } from '../public/core/curatedManifest.js'
import { nasaSaturnVVerifiedInventory, verifiedRenderableNodeNames, primaryBodyLongitudinalCoverage } from '../public/core/nasaSaturnVInventory.js'
import { validateCuratedCoverage, validateSemanticManifest } from '../public/core/semantic.js'

const manifestErrors = validateSemanticManifest(nasaSaturnVCuratedManifest)
const coverageErrors = validateCuratedCoverage(nasaSaturnVCuratedManifest, verifiedRenderableNodeNames)
const coverage = primaryBodyLongitudinalCoverage()

const report = {
  asset: {
    repository: nasaSaturnVVerifiedInventory.repository,
    path: nasaSaturnVVerifiedInventory.path,
    gitSha: nasaSaturnVVerifiedInventory.gitSha,
    renderableNodes: nasaSaturnVVerifiedInventory.renderableNodeCount,
    meshes: nasaSaturnVVerifiedInventory.meshCount,
  },
  semanticGroups: nasaSaturnVCuratedManifest.groups.map(group => ({
    id: group.id,
    label: group.label,
    mappedNodes: group.nodeNames?.length ?? 0,
  })),
  primaryBodyLongitudinalCoverage: Number(coverage.toFixed(4)),
  trueStageDetachmentFromCurrentGlb: coverage < 0.75,
  errors: [...manifestErrors, ...coverageErrors],
}

console.log(JSON.stringify(report, null, 2))
if (report.errors.length) process.exitCode = 1
