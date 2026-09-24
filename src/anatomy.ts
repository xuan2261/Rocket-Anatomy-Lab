export type AnatomyLanguage = 'vi' | 'en'
export type LocalizedText = { vi: string; en: string }
export type AnatomyKind = 'vehicle' | 'stage' | 'system' | 'component'
export type AnatomyBinding = 'reference-only' | 'approximate-region'
export type AnatomyNode = {
  id: string
  parentId: string | null
  kind: AnatomyKind
  label: LocalizedText
  description: LocalizedText
  normalizedPosition: number
  focusAssemblyId: string | null
  binding: AnatomyBinding
  sourceUrl: string
  sourceLabel: string
}
export type AnatomyManifest = { id: string; rootId: string; nodes: readonly AnatomyNode[] }

const NASA_SATURN_V = 'https://science.nasa.gov/3d-resources/saturn-v/'
const NASA_SIC = 'https://ntrs.nasa.gov/citations/20090016301'
const NASA_VEHICLE = 'https://www.nasa.gov/wp-content/uploads/static/history/afj/ap13fj/pdf/report-of-a13-review-board-19700615-19700076776.pdf'
const NASA_IU = 'https://www.nasa.gov/image-article/manufacturing-saturn-v-instrument-unit/'
const NASA_APOLLO = 'https://www.nasa.gov/history/diagrams/apollo.html'

const node = (
  id: string, parentId: string | null, kind: AnatomyKind,
  vi: string, en: string, descriptionVi: string, descriptionEn: string,
  normalizedPosition: number, focusAssemblyId: string | null,
  sourceUrl: string, sourceLabel: string,
  binding: AnatomyBinding = 'approximate-region',
): AnatomyNode => ({
  id, parentId, kind,
  label: { vi, en },
  description: { vi: descriptionVi, en: descriptionEn },
  normalizedPosition, focusAssemblyId, binding, sourceUrl, sourceLabel,
})

export const saturnVAnatomyManifest: AnatomyManifest = {
  id: 'nasa-saturn-v-reference-anatomy-v1',
  rootId: 'saturn-v',
  nodes: [
    node('saturn-v', null, 'vehicle',
      'Saturn V / Apollo', 'Saturn V / Apollo',
      'Cây giải phẫu tham chiếu theo tài liệu NASA. Các vị trí trên mô hình 3D chỉ là neo trực quan gần đúng, không phải ranh giới kỹ thuật được suy ra từ GLB.',
      'Reference anatomy based on NASA documentation. Positions on the 3D model are approximate visual anchors, not engineering boundaries inferred from the GLB.',
      0.5, null, NASA_SATURN_V, 'NASA Science — Saturn V', 'reference-only'),

    node('sic-stage', 'saturn-v', 'stage',
      'Tầng 1 · S-IC', 'Stage 1 · S-IC',
      'Tầng đẩy thứ nhất với cụm năm động cơ F-1 và các vùng kết cấu, bồn nhiên liệu/oxy hóa được NASA mô tả trong tài liệu huấn luyện.',
      'First stage with five F-1 engines and structural, fuel and oxidizer regions documented by NASA training material.',
      0.19, 'lower-body-assembly', NASA_SIC, 'NASA NTRS — Saturn V Stage I (S-IC) Overview'),
    node('sii-stage', 'saturn-v', 'stage',
      'Tầng 2 · S-II', 'Stage 2 · S-II',
      'Tầng hai sử dụng năm động cơ J-2, bồn LOX và LH2 với vách ngăn chung cách nhiệt.',
      'Second stage using five J-2 engines, LOX and LH2 tanks separated by an insulated common bulkhead.',
      0.49, 'center-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('sivb-stage', 'saturn-v', 'stage',
      'Tầng 3 · S-IVB', 'Stage 3 · S-IVB',
      'Tầng ba với một động cơ J-2 và hệ bồn LOX/LH2, nằm ngay dưới Instrument Unit.',
      'Third stage with one J-2 engine and LOX/LH2 tankage, directly below the Instrument Unit.',
      0.68, 'upper-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('instrument-unit', 'saturn-v', 'system',
      'Instrument Unit (IU)', 'Instrument Unit (IU)',
      'Vòng thiết bị dẫn đường, điều khiển và trình tự đặt trên S-IVB, giữa tên lửa và tàu Apollo.',
      'Guidance, control and sequencing equipment ring mounted atop S-IVB between the launch vehicle and Apollo spacecraft.',
      0.77, 'upper-body-assembly', NASA_IU, 'NASA — Saturn V Instrument Unit'),
    node('apollo-spacecraft', 'saturn-v', 'system',
      'Cụm tàu Apollo', 'Apollo spacecraft stack',
      'Phần trên gồm LM/SLA, Service Module, Command Module và Launch Escape System trong cấu hình phóng.',
      'Upper stack containing LM/SLA, Service Module, Command Module and Launch Escape System in launch configuration.',
      0.90, 'nose-stack-assembly', NASA_APOLLO, 'NASA — Project Apollo technical diagrams'),

    node('sic-f1-engines', 'sic-stage', 'component',
      'Cụm 5 động cơ F-1', 'Five F-1 engine cluster',
      'Cụm động cơ ở đáy S-IC. Đây là mục tham chiếu lịch sử; GLB hiện tại không chứa mô hình nội thất động cơ có thể tháo chi tiết.',
      'Engine cluster at the S-IC base. This is historical reference data; the current GLB does not contain disassemblable engine internals.',
      0.025, 'base-assembly', NASA_SIC, 'NASA NTRS — S-IC overview'),
    node('sic-thrust-structure', 'sic-stage', 'component',
      'Kết cấu truyền lực', 'Thrust structure',
      'Vùng kết cấu đáy truyền tải lực từ cụm động cơ lên thân tầng.',
      'Aft structural region carrying engine loads into the stage body.',
      0.075, 'base-assembly', NASA_SIC, 'NASA NTRS — S-IC overview'),
    node('sic-rp1-tank', 'sic-stage', 'component',
      'Bồn nhiên liệu RP-1', 'RP-1 fuel tank',
      'Bồn nhiên liệu của S-IC, hiển thị như neo tham chiếu bên trong chứ không phải mesh riêng trong GLB.',
      'S-IC fuel tank, shown as an internal reference anchor rather than a distinct mesh in the GLB.',
      0.17, 'lower-body-assembly', NASA_SIC, 'NASA NTRS — S-IC overview'),
    node('sic-intertank', 'sic-stage', 'component',
      'Intertank', 'Intertank',
      'Vùng kết cấu giữa bồn nhiên liệu và bồn oxy hóa.',
      'Structural region between the fuel and oxidizer tanks.',
      0.25, 'lower-body-assembly', NASA_SIC, 'NASA NTRS — S-IC overview'),
    node('sic-lox-tank', 'sic-stage', 'component',
      'Bồn LOX', 'LOX tank',
      'Bồn oxy lỏng của tầng S-IC; vị trí hiển thị là tham chiếu gần đúng theo chiều dọc phương tiện.',
      'S-IC liquid oxygen tank; the displayed location is an approximate longitudinal reference.',
      0.32, 'lower-body-assembly', NASA_SIC, 'NASA NTRS — S-IC overview'),
    node('sic-forward-skirt', 'sic-stage', 'component',
      'Forward skirt', 'Forward skirt',
      'Kết cấu phía trước của S-IC trước vùng ghép sang tầng S-II.',
      'Forward structural skirt of S-IC before the interface to S-II.',
      0.375, 'lower-body-assembly', NASA_SIC, 'NASA NTRS — S-IC overview'),

    node('sii-j2-engines', 'sii-stage', 'component',
      'Cụm 5 động cơ J-2', 'Five J-2 engine cluster',
      'Cụm động cơ phía sau tầng S-II.',
      'Aft engine cluster of the S-II stage.',
      0.405, 'center-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('sii-thrust-structure', 'sii-stage', 'component',
      'Kết cấu truyền lực', 'Thrust structure',
      'Kết cấu phía sau mang tải cụm J-2.',
      'Aft structure transmitting J-2 engine loads.',
      0.43, 'center-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('sii-lox-tank', 'sii-stage', 'component',
      'Bồn LOX', 'LOX tank',
      'Bồn oxy lỏng nằm phía sau bồn nhiên liệu LH2.',
      'Liquid oxygen tank located aft of the LH2 fuel tank.',
      0.465, 'center-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('sii-common-bulkhead', 'sii-stage', 'component',
      'Vách ngăn chung', 'Common bulkhead',
      'Vách ngăn chung cách nhiệt giữa LOX và LH2.',
      'Insulated common bulkhead separating LOX and LH2.',
      0.50, 'center-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('sii-lh2-tank', 'sii-stage', 'component',
      'Bồn LH2', 'LH2 tank',
      'Bồn hydro lỏng phía trước của tầng S-II.',
      'Forward liquid hydrogen tank of S-II.',
      0.545, 'center-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('sii-forward-skirt', 'sii-stage', 'component',
      'Forward skirt', 'Forward skirt',
      'Kết cấu phía trước của S-II trước vùng ghép với S-IVB.',
      'Forward structural skirt of S-II before the S-IVB interface.',
      0.595, 'center-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),

    node('sivb-j2-engine', 'sivb-stage', 'component',
      'Động cơ J-2', 'J-2 engine',
      'Một động cơ J-2 đặt trên trục trung tâm của S-IVB.',
      'Single J-2 engine on the S-IVB centerline.',
      0.62, 'upper-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('sivb-lox-tank', 'sivb-stage', 'component',
      'Bồn LOX', 'LOX tank',
      'Bồn oxy lỏng phía sau của S-IVB.',
      'Aft liquid oxygen tank of S-IVB.',
      0.65, 'upper-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('sivb-common-bulkhead', 'sivb-stage', 'component',
      'Vách ngăn chung', 'Common bulkhead',
      'Vách ngăn chung cách nhiệt giữa LOX và LH2 của S-IVB.',
      'Insulated common bulkhead between S-IVB LOX and LH2.',
      0.68, 'upper-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('sivb-lh2-tank', 'sivb-stage', 'component',
      'Bồn LH2', 'LH2 tank',
      'Bồn hydro lỏng phía trước của S-IVB.',
      'Forward liquid hydrogen tank of S-IVB.',
      0.71, 'upper-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),
    node('sivb-forward-skirt', 'sivb-stage', 'component',
      'Forward skirt', 'Forward skirt',
      'Vùng kết cấu trên của S-IVB ngay dưới Instrument Unit.',
      'Upper structural region of S-IVB immediately below the Instrument Unit.',
      0.745, 'upper-body-assembly', NASA_VEHICLE, 'NASA — Apollo/Saturn V vehicle report'),

    node('iu-guidance-control', 'instrument-unit', 'system',
      'Dẫn đường & điều khiển', 'Guidance & control',
      'Nhóm chức năng dẫn đường, điều khiển và trình tự của phương tiện.',
      'Vehicle guidance, control and sequencing functions.',
      0.77, 'upper-body-assembly', NASA_IU, 'NASA — Saturn V Instrument Unit'),
    node('iu-electronics-ring', 'instrument-unit', 'component',
      'Vòng thiết bị điện tử', 'Electronics ring',
      'Các hộp điện tử được bố trí quanh mặt trong cấu hình vòng của Instrument Unit.',
      'Electronics boxes arranged around the inside of the Instrument Unit ring.',
      0.78, 'upper-body-assembly', NASA_IU, 'NASA — Saturn V Instrument Unit'),

    node('apollo-lm-sla', 'apollo-spacecraft', 'system',
      'Lunar Module & SLA', 'Lunar Module & SLA',
      'Lunar Module nằm trong Spacecraft-Lunar Module Adapter ở cấu hình phóng.',
      'Lunar Module housed inside the Spacecraft-Lunar Module Adapter in launch configuration.',
      0.82, 'nose-stack-assembly', NASA_APOLLO, 'NASA — Project Apollo technical diagrams'),
    node('apollo-service-module', 'apollo-spacecraft', 'component',
      'Service Module', 'Service Module',
      'Module dịch vụ của tổ hợp Command/Service Module.',
      'Service module of the Command/Service Module stack.',
      0.88, 'nose-stack-assembly', NASA_APOLLO, 'NASA — Project Apollo technical diagrams'),
    node('apollo-command-module', 'apollo-spacecraft', 'component',
      'Command Module', 'Command Module',
      'Khoang chỉ huy của tổ hợp Apollo.',
      'Command module of the Apollo spacecraft stack.',
      0.93, 'nose-stack-assembly', NASA_APOLLO, 'NASA — Project Apollo technical diagrams'),
    node('apollo-les', 'apollo-spacecraft', 'system',
      'Launch Escape System', 'Launch Escape System',
      'Hệ thống thoát hiểm phóng ở đỉnh cấu hình Apollo.',
      'Launch escape system at the top of the Apollo launch configuration.',
      0.985, 'nose-stack-assembly', NASA_APOLLO, 'NASA — Project Apollo technical diagrams'),
  ],
}

export const anatomyNodeById = (manifest: AnatomyManifest, id: string): AnatomyNode | null =>
  manifest.nodes.find(item => item.id === id) ?? null

export const anatomyChildren = (manifest: AnatomyManifest, parentId: string): AnatomyNode[] =>
  manifest.nodes.filter(item => item.parentId === parentId)

export const anatomyPath = (manifest: AnatomyManifest, id: string): AnatomyNode[] => {
  const path: AnatomyNode[] = []
  const visited = new Set<string>()
  let current = anatomyNodeById(manifest, id)
  while (current) {
    if (visited.has(current.id)) throw new Error(`anatomy cycle detected at ${current.id}`)
    visited.add(current.id)
    path.unshift(current)
    current = current.parentId ? anatomyNodeById(manifest, current.parentId) : null
  }
  return path
}

export const anatomyText = (value: LocalizedText, language: string): string =>
  language === 'en' ? value.en : value.vi

export const validateAnatomyManifest = (manifest: AnatomyManifest): string[] => {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const item of manifest.nodes) {
    if (!item.id.trim()) errors.push('anatomy node id must be non-empty')
    if (ids.has(item.id)) errors.push(`duplicate anatomy node id: ${item.id}`)
    ids.add(item.id)
    if (!Number.isFinite(item.normalizedPosition) || item.normalizedPosition < 0 || item.normalizedPosition > 1) {
      errors.push(`${item.id}: normalizedPosition must be within 0..1`)
    }
    if (!item.label.vi.trim() || !item.label.en.trim()) errors.push(`${item.id}: localized label is required`)
    if (!item.description.vi.trim() || !item.description.en.trim()) errors.push(`${item.id}: localized description is required`)
    if (!/^https:\/\/(?:www\.)?(?:nasa\.gov|science\.nasa\.gov|ntrs\.nasa\.gov)\//.test(item.sourceUrl)) {
      errors.push(`${item.id}: sourceUrl must be an official NASA URL`)
    }
  }
  const root = anatomyNodeById(manifest, manifest.rootId)
  if (!root) errors.push('anatomy rootId must resolve to a node')
  else if (root.parentId !== null) errors.push('anatomy root node must not have a parent')
  for (const item of manifest.nodes) {
    if (item.parentId && !anatomyNodeById(manifest, item.parentId)) errors.push(`${item.id}: parent does not exist`)
    try {
      const path = anatomyPath(manifest, item.id)
      if (path[0]?.id !== manifest.rootId) errors.push(`${item.id}: node is not connected to root`)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }
  return [...new Set(errors)]
}
