import type { AssemblyManifest } from './assembly.js'
import type { SemanticManifest } from './semantic.js'
import { nasaSaturnVVerifiedInventory } from './nasaSaturnVInventory.js'

export const nasaSaturnVAssemblyManifest: AssemblyManifest = {
  id: 'nasa-saturn-v-education-assembly-v1',
  label: 'NASA Saturn V — mô hình giáo dục có thể tách cụm',
  sourceLabel: 'NASA 3D Resources / Michael D. Carbajal',
  educationalOnly: true,
  methodology: 'normalized-axis-triangle-partition',
  source: {
    repository: nasaSaturnVVerifiedInventory.repository,
    path: nasaSaturnVVerifiedInventory.path,
    gitSha: nasaSaturnVVerifiedInventory.gitSha,
    sha256: '6c44497bce54ee0b09d0edb8e33a6f484762a320dab1c54b383e434f5bba06b5',
    byteLength: 927212,
    officialDownloadUrl: 'https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/saturn-v/Saturn%20V.glb',
    githubRawUrl: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Saturn%20V/Saturn%20V.glb',
    primaryAxis: 'y',
    bounds: nasaSaturnVVerifiedInventory.globalBounds,
  },
  // These are display-oriented geometry regions, not historical stage boundaries.
  // Boundaries are normalized against the pinned GLB's verified Y extent and align
  // with stable visual transitions seen in the source geometry/preview.
  segments: [
    {
      id: 'base-assembly',
      label: 'Cụm đáy',
      description: 'Vùng trực quan thấp nhất của mô hình giáo dục, được tạo thành một nhánh có thể biến đổi độc lập.',
      start: 0,
      end: 0.16,
      explodeSignedFactor: -1.6,
    },
    {
      id: 'lower-body-assembly',
      label: 'Cụm thân dưới',
      description: 'Vùng thân dưới được tách số hóa để quan sát và trình bày lắp/tách có thể đảo ngược.',
      start: 0.16,
      end: 0.35,
      explodeSignedFactor: -0.8,
    },
    {
      id: 'center-body-assembly',
      label: 'Cụm thân giữa',
      description: 'Vùng trực quan trung tâm dùng làm mốc trung tính trong chế độ tách cụm.',
      start: 0.35,
      end: 0.61,
      explodeSignedFactor: 0,
    },
    {
      id: 'upper-body-assembly',
      label: 'Cụm thân trên',
      description: 'Vùng thân trên được tạo thành một nhánh giáo dục có thể biến đổi độc lập.',
      start: 0.61,
      end: 0.88,
      explodeSignedFactor: 0.8,
    },
    {
      id: 'nose-stack-assembly',
      label: 'Cụm mũi / phía tàu vũ trụ',
      description: 'Vùng trực quan phía trên của mô hình nhập, được tách để trình bày mà không khẳng định ranh giới tầng lịch sử.',
      start: 0.88,
      end: 1,
      explodeSignedFactor: 1.6,
    },
  ],
}

export const nasaSaturnVAssemblySemanticManifest: SemanticManifest = {
  id: nasaSaturnVAssemblyManifest.id,
  label: nasaSaturnVAssemblyManifest.label,
  sourceLabel: nasaSaturnVAssemblyManifest.sourceLabel,
  educationalOnly: true,
  mappingKind: 'assembly-node-map',
  groups: nasaSaturnVAssemblyManifest.segments.map((segment, bandIndex) => ({
    id: segment.id,
    label: segment.label,
    description: segment.description,
    bandIndex,
    explodeSignedFactor: segment.explodeSignedFactor,
    evidence: {
      basis: 'verified-geometry',
      note: `Vùng cụm số hóa ${(segment.start * 100).toFixed(0)}–${(segment.end * 100).toFixed(0)}% theo trục chính đã xác minh của mô hình ghim; không phải nhãn tầng lịch sử.`,
    },
  })),
}
