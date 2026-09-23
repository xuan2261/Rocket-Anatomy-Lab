import type { SemanticManifest } from './semantic.js'
import { nasaSaturnVVerifiedInventory, verifiedRenderableNodeNames } from './nasaSaturnVInventory.js'

export const nasaSaturnVCuratedManifest: SemanticManifest = {
  id: 'nasa-saturn-v-curated-node-map-v1',
  label: 'NASA Saturn V — bản đồ đối tượng giáo dục đã tuyển chọn',
  sourceLabel: 'NASA 3D Resources / Michael D. Carbajal',
  educationalOnly: true,
  mappingKind: 'curated-node-map',
  assetFingerprint: {
    repository: nasaSaturnVVerifiedInventory.repository,
    path: nasaSaturnVVerifiedInventory.path,
    gitSha: nasaSaturnVVerifiedInventory.gitSha,
    expectedNodeNames: verifiedRenderableNodeNames,
    expectedNodeCount: nasaSaturnVVerifiedInventory.nodeCount,
    expectedMeshCount: nasaSaturnVVerifiedInventory.meshCount,
    primaryAxis: 'y',
  },
  groups: [
    {
      id: 'base-hardware',
      label: 'Phần cứng đáy và cánh ổn định',
      description: 'Các đối tượng bên ngoài được tuyển chọn quanh phần đáy mô hình NASA. Đây là nhóm hiển thị giáo dục, không phải khẳng định về ranh giới tách tầng.',
      bandIndex: 0,
      explodeSignedFactor: -1.0,
      nodeNames: [
        'group1 gro', 'group1 pCo', 'group3 gro', 'group6 pCu', 'group7 pCu',
        'pCone2 gro', 'pCube1 gr1', 'pCube1 gro',
        'polySurfa1', 'polySurfa2', 'polySurfa3', 'polySurfa4', 'polySurfac',
      ],
      evidence: {
        basis: 'verified-geometry',
        note: 'All mapped objects occupy the lowest portion of the pinned GLB and match the base/fin region in the official preview.',
      },
    },
    {
      id: 'lower-body-details',
      label: 'Chi tiết ngoài thân dưới',
      description: 'Hai đối tượng ngoài hẹp kéo dài qua phần thân dưới, được giữ riêng khỏi vỏ chính để quan sát.',
      bandIndex: 1,
      explodeSignedFactor: -0.45,
      nodeNames: ['pCylinder2', 'pCylinder3'],
      evidence: {
        basis: 'verified-geometry',
        note: 'Both objects span approximately Y=1.93–4.34 in the pinned GLB.',
      },
    },
    {
      id: 'mid-body-details',
      label: 'Chi tiết ngoài thân giữa',
      description: 'Hai đối tượng ngoài hẹp tập trung quanh vùng giữa-trên. Nhóm này chỉ mang tính mô tả và không khẳng định danh tính tầng lịch sử.',
      bandIndex: 2,
      explodeSignedFactor: 0.15,
      nodeNames: ['group8 pCy', 'group9 pCy'],
      evidence: {
        basis: 'verified-geometry',
        note: 'Both objects span approximately Y=5.72–7.73 in the pinned GLB.',
      },
    },
    {
      id: 'upper-exterior-details',
      label: 'Chi tiết ngoài thân trên',
      description: 'Các đối tượng ngoài nhỏ tập trung gần đầu trên của mô hình nhập, chỉ được nhóm để chọn và quan sát.',
      bandIndex: 3,
      explodeSignedFactor: 0.65,
      nodeNames: ['group10 pC', 'group11 pC', 'pCylinder4', 'pCylinder5'],
      evidence: {
        basis: 'verified-geometry',
        note: 'All four objects are tightly clustered around Y=11.19–11.31 in the pinned GLB.',
      },
    },
    {
      id: 'primary-body-shell',
      label: 'Vỏ thân chính',
      description: 'Đối tượng thân chính trong tài nguyên trình bày, kéo dài gần toàn bộ mô hình; vì vậy GLB gốc không thể tách trung thực các tầng lịch sử chỉ bằng phép biến đổi node.',
      bandIndex: 4,
      explodeSignedFactor: 0,
      nodeNames: ['pCylinder1'],
      evidence: {
        basis: 'verified-geometry',
        note: 'pCylinder1 spans roughly 96.8% of the model longitudinal range and contains nine render primitives.',
      },
    },
  ],
}
