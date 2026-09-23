import type { ModelManifest } from './types.js'

// Deliberately generic educational segmentation. It is NOT a construction model
// and is not claimed to map 1:1 to NASA GLB node names.
export const demoManifest: ModelManifest = {
  id: 'civil-launch-vehicle-demo',
  label: 'Phương tiện phóng vũ trụ dân sự — bản minh họa cấu trúc',
  sourceLabel: 'Hình học dự phòng sinh thủ tục để kiểm thử tương tác',
  educationalOnly: true,
  parts: [
    {
      id: 'upper-module',
      label: 'Mô-đun trên',
      description: 'Nhóm trực quan phía trên dùng để minh họa chọn và tách cụm.',
      geometry: { kind: 'cone', height: 1.35, radiusBottom: 0.62, radiusTop: 0.02, baseY: 5.05 },
      explode: { axis: [0, 1, 0], distance: 2.0 },
    },
    {
      id: 'upper-stage',
      label: 'Vỏ cụm trên',
      description: 'Nhóm hình trụ phía trên dạng tổng quát, chỉ dùng để trực quan hóa.',
      geometry: { kind: 'frustum', height: 1.75, radiusBottom: 0.86, radiusTop: 0.62, baseY: 3.30 },
      explode: { axis: [0, 1, 0], distance: 1.35 },
    },
    {
      id: 'middle-stage',
      label: 'Vỏ cụm giữa',
      description: 'Nhóm giữa dạng tổng quát dùng cho tương tác ẩn, cô lập và X-quang.',
      geometry: { kind: 'cylinder', height: 2.05, radiusBottom: 1.05, radiusTop: 1.05, baseY: 1.25 },
      explode: { axis: [0, 1, 0], distance: 0.55 },
    },
    {
      id: 'lower-stage',
      label: 'Vỏ cụm dưới',
      description: 'Nhóm thân dưới dạng tổng quát cho nguyên mẫu cấu trúc tương tác.',
      geometry: { kind: 'cylinder', height: 2.65, radiusBottom: 1.17, radiusTop: 1.05, baseY: -1.40 },
      explode: { axis: [0, -1, 0], distance: 0.55 },
    },
    {
      id: 'aft-section',
      label: 'Nhóm trực quan phía đáy',
      description: 'Nhóm trực quan phía đáy; không mô phỏng hành vi động lực hoặc quy trình chế tạo.',
      geometry: { kind: 'frustum', height: 1.20, radiusBottom: 0.84, radiusTop: 1.17, baseY: -2.60 },
      explode: { axis: [0, -1, 0], distance: 1.35 },
    }
  ]
}
