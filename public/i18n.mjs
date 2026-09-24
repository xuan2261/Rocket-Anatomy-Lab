const STORAGE_KEY = 'rocket-anatomy-lab.language'
const DEFAULT_LANGUAGE = 'vi'
const SUPPORTED = new Set(['vi', 'en'])

const messages = {
  vi: {
    'app.eyebrow': 'TRỰC QUAN 3D GIÁO DỤC',
    'app.title': 'Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ',
    'app.metaDescription': 'Rocket Anatomy Lab — trình trực quan hóa 3D giáo dục cho mô hình Saturn V của NASA.',
    'app.assetLoading': 'Đang tải mô hình Saturn V của NASA…',
    'app.assetLoadingAssembly': 'Đang tải mô hình giáo dục có thể lắp/tách…',
    'app.assetFallbackForced': 'Hình học dự phòng bắt buộc',
    'app.assetFallbackOffline': 'Hình học dự phòng ngoại tuyến',
    'app.assetAssembly': 'GLB giáo dục hỗ trợ lắp/tách · {count} nhánh có thể biến đổi · trục {axis}',
    'app.assetPresentation': 'GLB trình bày Saturn V của NASA · {count} đối tượng đã tuyển chọn · trục {axis}',
    'app.sourceAssembly': 'Đã tải GLB giáo dục tái cấu trúc từ {source}. Mỗi cụm trực quan chính là một nhánh độc lập và trạng thái tách cụm có thể đảo ngược. Ranh giới chỉ phục vụ hiển thị, không khẳng định ranh giới tầng lịch sử.',
    'app.sourcePresentation': 'Đã tải tài nguyên trình bày từ {source}. Bản đồ đối tượng được ghim theo Git blob NASA {sha}…; chế độ này hỗ trợ quan sát nhưng không tách các cụm chính nếu chưa tái cấu trúc asset.',
    'source.educationLocal': 'GLB giáo dục tái cấu trúc cục bộ',
    'source.presentationLocal': 'GLB trình bày NASA cục bộ',
    'source.presentationRemote': 'tài nguyên trình bày NASA từ xa',
    'language.group': 'Ngôn ngữ',
    'language.vi': 'Tiếng Việt',
    'language.en': 'English',
    'structure.panelAria': 'Bảng cấu trúc',
    'structure.kicker': 'CẤU TRÚC',
    'structure.title': 'Các cụm giáo dục',
    'structure.showAll': 'Hiện tất cả',
    'structure.treeAria': 'Cấu trúc mô hình',
    'structure.sourceNote': 'Trình xem ưu tiên GLB giáo dục đã được tái cấu trúc cục bộ với các nhánh có thể biến đổi độc lập. Nếu không có, tài nguyên trình bày NASA đã xác minh vẫn được dùng ở chế độ chỉ quan sát.',
    'structure.rawSummary': 'Danh sách đối tượng gốc',
    'structure.rawHelp': 'Chế độ gỡ lỗi: tên đối tượng nhập/tái cấu trúc → cụm giáo dục đang hoạt động.',
    'structure.modeAria': 'Chế độ duyệt cấu trúc',
    'structure.modeModel': 'Mô hình 3D',
    'structure.modeAnatomy': 'Giải phẫu NASA',
    'anatomy.panelAria': 'Giải phẫu tham chiếu NASA',
    'anatomy.title': 'Giải phẫu NASA',
    'anatomy.kicker': 'GIẢI PHẪU THAM CHIẾU',
    'anatomy.back': '← Quay lại',
    'anatomy.breadcrumbAria': 'Đường dẫn giải phẫu',
    'anatomy.childrenAria': 'Các mục giải phẫu con',
    'anatomy.focus': 'Tập trung vùng 3D',
    'anatomy.inspect': 'Khám phá bên trong',
    'anatomy.bindingApproximate': 'NASA · vị trí 3D gần đúng',
    'anatomy.bindingReference': 'Tham chiếu NASA',
    'anatomy.bindingNote': 'Các vị trí 3D là neo trực quan gần đúng; không phải ranh giới kỹ thuật được suy ra từ GLB.',
    'anatomy.source': 'Nguồn: {source} ↗',
    'anatomy.childCount': '{count} mục chi tiết',
    'anatomy.referenceLeaf': 'Mục tham chiếu',
    'anatomy.kind.vehicle': 'Phương tiện',
    'anatomy.kind.stage': 'Tầng',
    'anatomy.kind.system': 'Hệ thống',
    'anatomy.kind.component': 'Thành phần',
    'viewer.panelAria': 'Trình xem 3D',
    'viewer.canvasAria': 'Mô hình phương tiện phóng vũ trụ 3D giáo dục. Kéo để xoay; lăn chuột để thu phóng; bấm vào một phần để chọn.',
    'viewer.hint': 'Kéo để xoay · Lăn chuột để thu phóng · Bấm vào một phần để chọn',
    'viewer.mode.normal': 'Bình thường',
    'viewer.mode.ghost': 'Bóng mờ',
    'viewer.mode.xray': 'X-quang',
    'viewer.inspectInside': 'Khám phá bên trong',
    'viewer.inspectInsideHint': 'Bật X-quang và mặt cắt tại vùng đang chọn. Mô hình nguồn chủ yếu là vỏ ngoài nên chỉ hiển thị geometry thực có trong GLB.',
    'viewer.reset': 'Đặt lại góc nhìn',
    'viewer.assembled': 'Lắp hoàn chỉnh',
    'viewer.exploded': 'Tách cụm',
    'viewer.explodeAria': 'Mức tách các cụm',
    'inspector.kicker': 'THÔNG TIN',
    'inspector.noneTitle': 'Chưa chọn',
    'inspector.noneDescription': 'Chọn một cụm giáo dục trên mô hình hoặc trong cây cấu trúc.',
    'inspector.visibility': 'Hiển thị',
    'inspector.viewMode': 'Chế độ xem',
    'inspector.explode': 'Mức tách cụm',
    'inspector.visible': 'Đang hiện',
    'inspector.hidden': 'Đang ẩn',
    'inspector.isolate': 'Cô lập',
    'inspector.exitIsolate': 'Thoát cô lập',
    'inspector.hide': 'Ẩn',
    'inspector.show': 'Hiện',
    'inspector.guided': 'Có hướng dẫn {percent}%',
    'timeline.aria': 'Dòng thời gian trình bày số có hướng dẫn',
    'timeline.kicker': 'TRÌNH BÀY CÓ HƯỚNG DẪN',
    'timeline.initial': 'Trạng thái lắp ghép ban đầu',
    'timeline.fullyExploded': 'Đã tách toàn bộ các cụm số hóa',
    'timeline.step': 'Bước {step}/{total}',
    'timeline.focus': 'Trọng tâm: {label}',
    'timeline.unavailable': 'Dòng thời gian không khả dụng ở chế độ chỉ quan sát',
    'timeline.motionReduced': 'Chuyển động: giảm',
    'timeline.motionStandard': 'Chuyển động: tiêu chuẩn',
    'timeline.previous': 'Trước',
    'timeline.previousAria': 'Bước trình bày trước',
    'timeline.play': 'Phát',
    'timeline.playAria': 'Phát trình bày có hướng dẫn',
    'timeline.pause': 'Tạm dừng',
    'timeline.pauseAria': 'Tạm dừng trình bày có hướng dẫn',
    'timeline.next': 'Tiếp',
    'timeline.nextAria': 'Bước trình bày tiếp theo',
    'timeline.restart': 'Khởi động lại',
    'timeline.restartAria': 'Khởi động lại từ trạng thái lắp ghép ban đầu',
    'timeline.sliderLabel': 'Bước trình bày',
    'timeline.directionDisassemble': 'Hướng: Tháo rời',
    'timeline.directionAssemble': 'Hướng: Lắp lại',
    'timeline.directionDisassembleAria': 'Hướng trình bày: tháo rời',
    'timeline.directionAssembleAria': 'Hướng trình bày: lắp lại',
    'section.aria': 'Điều khiển mặt cắt và quan sát bên trong',
    'section.kicker': 'MẶT CẮT / QUAN SÁT BÊN TRONG',
    'section.offStatus': 'Mặt cắt đang tắt',
    'section.unavailable': 'Mặt cắt không khả dụng ở chế độ dự phòng',
    'section.open': 'mặt cắt mở',
    'section.visualCap': 'có nắp trực quan',
    'section.standard': 'chuẩn',
    'section.inverted': 'đảo hướng',
    'section.toggleOn': 'Mặt cắt: Bật',
    'section.toggleOff': 'Mặt cắt: Tắt',
    'section.axisAria': 'Trục mặt cắt',
    'section.sliderLabel': 'Vị trí mặt phẳng cắt',
    'section.sliderValue': '{percent}% theo trục {axis}, hướng {direction}',
    'section.directionStandard': 'Hướng: Chuẩn',
    'section.directionInverted': 'Hướng: Đảo',
    'section.capOn': 'Nắp trực quan: Bật',
    'section.capOff': 'Nắp trực quan: Tắt',
    'section.capUnavailable': 'Nắp trực quan: Không khả dụng',
    'controls.aria': 'Điều khiển trình xem',
    'controls.modeAria': 'Chế độ xem',
    'tree.showPart': 'Hiện {label}',
    'tree.oneTransformable': '1 nhánh có thể biến đổi',
    'tree.importedObjects': '{count} đối tượng gốc đã nhập',
    'raw.unnamed': '(không tên)',
    'raw.unmapped': 'Chưa ánh xạ',
    'raw.fallbackOnly': 'Danh sách đối tượng gốc NASA chỉ khả dụng khi trình kết xuất GLB thật được tải.',
    'learning.aria': 'Bài học giáo dục có hướng dẫn',
    'learning.toggle': 'BÀI HỌC CÓ HƯỚNG DẪN',
    'learning.kicker': 'GIẢI PHẪU SỐ HÓA',
    'learning.progress': 'Bài {current}/{total}',
    'learning.previous': 'Bài trước',
    'learning.next': 'Bài tiếp',
    'learning.focus': 'Tập trung',
    'learning.applyView': 'Áp dụng góc nhìn học tập',
    'learning.copyLink': 'Sao chép liên kết bài học',
    'learning.copied': 'Đã sao chép liên kết bài học.',
    'learning.copyFailed': 'Không thể sao chép tự động; URL hiện tại đã chứa trạng thái bài học.',
    'learning.annotationsOn': 'Chú thích: Bật',
    'learning.annotationsOff': 'Chú thích: Tắt',
    'learning.annotationAria': 'Mở bài học cho {label}',
    'learning.annotationLayerAria': 'Các điểm chú thích giáo dục',
    'learning.unavailable': 'Bài học không khả dụng',
    'learning.unavailableDescription': 'Chế độ này cần GLB giáo dục đã tái cấu trúc với các cụm semantic đã xác minh.',
    'learning.lesson.base.title': 'Bài 1 · Cụm đáy',
    'learning.lesson.base.body': 'Quan sát vùng thấp nhất của mô hình số hóa và mối liên hệ vị trí của nó với toàn bộ phương tiện. Ranh giới trong bài chỉ phục vụ trình bày hình học giáo dục.',
    'learning.lesson.lower.title': 'Bài 2 · Cụm thân dưới',
    'learning.lesson.lower.body': 'Khám phá vùng thân dưới như một cụm hiển thị độc lập, dùng để luyện thao tác chọn, cô lập và quan sát mặt cắt trên mô hình số.',
    'learning.lesson.center.title': 'Bài 3 · Cụm thân giữa',
    'learning.lesson.center.body': 'Dùng vùng trung tâm làm mốc để so sánh tương quan giữa các cụm phía dưới và phía trên. Chế độ bóng mờ giúp duy trì bối cảnh không gian.',
    'learning.lesson.upper.title': 'Bài 4 · Cụm thân trên',
    'learning.lesson.upper.body': 'Quan sát vùng thân trên trong cấu trúc tổng thể và cách nó được biểu diễn thành một nhánh semantic độc lập trong GLB giáo dục.',
    'learning.lesson.nose.title': 'Bài 5 · Cụm mũi / phía tàu vũ trụ',
    'learning.lesson.nose.body': 'Khảo sát vùng trên cùng của mô hình số hóa. Nhãn bài học mô tả vùng hiển thị giáo dục, không khẳng định ranh giới tầng lịch sử hay quy trình lắp ráp ngoài đời.',
  },
  en: {
    'app.eyebrow': 'EDUCATIONAL 3D VISUALIZATION',
    'app.title': 'Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ',
    'app.metaDescription': 'Rocket Anatomy Lab — an educational 3D visualization of NASA Saturn V digital assets.',
    'app.assetLoading': 'Loading NASA Saturn V model…',
    'app.assetLoadingAssembly': 'Loading assembly-capable educational model…',
    'app.assetFallbackForced': 'Forced fallback geometry',
    'app.assetFallbackOffline': 'Offline fallback geometry',
    'app.assetAssembly': 'Assembly-capable educational GLB · {count} transformable subtrees · axis {axis}',
    'app.assetPresentation': 'NASA Saturn V presentation GLB · {count} curated objects · axis {axis}',
    'app.sourceAssembly': 'Loaded the re-authored educational GLB from {source}. Each major visual assembly is an independent subtree and exploded transforms are reversible. Boundaries are display-oriented regions, not claims about historical stage boundaries.',
    'app.sourcePresentation': 'Loaded the presentation asset from {source}. The object map is pinned to NASA Git blob {sha}…; this mode supports inspection but does not detach the major assemblies until the asset is re-authored.',
    'source.educationLocal': 'local re-authored educational GLB',
    'source.presentationLocal': 'local NASA presentation GLB',
    'source.presentationRemote': 'remote NASA presentation asset',
    'language.group': 'Language',
    'language.vi': 'Tiếng Việt',
    'language.en': 'English',
    'structure.panelAria': 'Structure panel',
    'structure.kicker': 'STRUCTURE',
    'structure.title': 'Educational assemblies',
    'structure.showAll': 'Show all',
    'structure.treeAria': 'Model structure',
    'structure.sourceNote': 'The viewer prefers the locally re-authored educational GLB with independently transformable subtrees. If it is unavailable, the verified NASA presentation asset remains available in inspection-only mode.',
    'structure.rawSummary': 'Raw object inventory',
    'structure.rawHelp': 'Debug view: imported/re-authored object name → active educational assembly.',
    'structure.modeAria': 'Structure browsing mode',
    'structure.modeModel': '3D model',
    'structure.modeAnatomy': 'NASA anatomy',
    'anatomy.panelAria': 'NASA reference anatomy',
    'anatomy.title': 'NASA anatomy',
    'anatomy.kicker': 'REFERENCE ANATOMY',
    'anatomy.back': '← Back',
    'anatomy.breadcrumbAria': 'Anatomy breadcrumb',
    'anatomy.childrenAria': 'Child anatomy items',
    'anatomy.focus': 'Focus 3D region',
    'anatomy.inspect': 'Inspect inside',
    'anatomy.bindingApproximate': 'NASA · approximate 3D position',
    'anatomy.bindingReference': 'NASA reference',
    'anatomy.bindingNote': '3D positions are approximate visual anchors, not engineering boundaries inferred from the GLB.',
    'anatomy.source': 'Source: {source} ↗',
    'anatomy.childCount': '{count} detail items',
    'anatomy.referenceLeaf': 'Reference item',
    'anatomy.kind.vehicle': 'Vehicle',
    'anatomy.kind.stage': 'Stage',
    'anatomy.kind.system': 'System',
    'anatomy.kind.component': 'Component',
    'viewer.panelAria': '3D viewer',
    'viewer.canvasAria': 'Educational 3D civil launch vehicle model. Drag to rotate; use the wheel to zoom; click a part to select it.',
    'viewer.hint': 'Drag to rotate · Wheel to zoom · Click a part to select',
    'viewer.mode.normal': 'Normal',
    'viewer.mode.ghost': 'Ghost',
    'viewer.mode.xray': 'X-ray',
    'viewer.inspectInside': 'Inspect inside',
    'viewer.inspectInsideHint': 'Turns on X-ray and a section cut at the selected region. The source model is mostly exterior geometry, so only geometry truly present in the GLB can be revealed.',
    'viewer.reset': 'Reset view',
    'viewer.assembled': 'Assembled',
    'viewer.exploded': 'Exploded',
    'viewer.explodeAria': 'Assembly separation amount',
    'inspector.kicker': 'INSPECTOR',
    'inspector.noneTitle': 'No selection',
    'inspector.noneDescription': 'Select an educational assembly in the model or structure tree.',
    'inspector.visibility': 'Visibility',
    'inspector.viewMode': 'View mode',
    'inspector.explode': 'Explode',
    'inspector.visible': 'Visible',
    'inspector.hidden': 'Hidden',
    'inspector.isolate': 'Isolate',
    'inspector.exitIsolate': 'Exit isolate',
    'inspector.hide': 'Hide',
    'inspector.show': 'Show',
    'inspector.guided': 'Guided {percent}%',
    'timeline.aria': 'Guided digital presentation timeline',
    'timeline.kicker': 'GUIDED PRESENTATION',
    'timeline.initial': 'Assembled baseline',
    'timeline.fullyExploded': 'Fully exploded digital view',
    'timeline.step': 'Step {step}/{total}',
    'timeline.focus': 'Focus: {label}',
    'timeline.unavailable': 'Timeline unavailable in inspection-only mode',
    'timeline.motionReduced': 'Motion: reduced',
    'timeline.motionStandard': 'Motion: standard',
    'timeline.previous': 'Previous',
    'timeline.previousAria': 'Previous presentation step',
    'timeline.play': 'Play',
    'timeline.playAria': 'Play guided presentation',
    'timeline.pause': 'Pause',
    'timeline.pauseAria': 'Pause guided presentation',
    'timeline.next': 'Next',
    'timeline.nextAria': 'Next presentation step',
    'timeline.restart': 'Restart',
    'timeline.restartAria': 'Restart from assembled baseline',
    'timeline.sliderLabel': 'Presentation step',
    'timeline.directionDisassemble': 'Direction: Disassemble',
    'timeline.directionAssemble': 'Direction: Assemble',
    'timeline.directionDisassembleAria': 'Presentation direction: disassemble',
    'timeline.directionAssembleAria': 'Presentation direction: assemble',
    'section.aria': 'Section and cutaway controls',
    'section.kicker': 'SECTION / CUTAWAY',
    'section.offStatus': 'Section view off',
    'section.unavailable': 'Section view unavailable in fallback mode',
    'section.open': 'open section',
    'section.visualCap': 'visual cap',
    'section.standard': 'standard',
    'section.inverted': 'inverted',
    'section.toggleOn': 'Section: On',
    'section.toggleOff': 'Section: Off',
    'section.axisAria': 'Section axis',
    'section.sliderLabel': 'Section plane position',
    'section.sliderValue': '{percent}% on {axis} axis, {direction} direction',
    'section.directionStandard': 'Direction: Standard',
    'section.directionInverted': 'Direction: Flipped',
    'section.capOn': 'Visual cap: On',
    'section.capOff': 'Visual cap: Off',
    'section.capUnavailable': 'Visual cap: Unavailable',
    'controls.aria': 'Viewer controls',
    'controls.modeAria': 'View mode',
    'tree.showPart': 'Show {label}',
    'tree.oneTransformable': '1 transformable subtree',
    'tree.importedObjects': '{count} imported source objects',
    'raw.unnamed': '(unnamed)',
    'raw.unmapped': 'Unmapped',
    'raw.fallbackOnly': 'The raw NASA object inventory is available only when the real GLB renderer is loaded.',
    'learning.aria': 'Guided educational lessons',
    'learning.toggle': 'GUIDED LEARNING',
    'learning.kicker': 'DIGITAL ANATOMY',
    'learning.progress': 'Lesson {current}/{total}',
    'learning.previous': 'Previous lesson',
    'learning.next': 'Next lesson',
    'learning.focus': 'Focus',
    'learning.applyView': 'Apply learning view',
    'learning.copyLink': 'Copy lesson link',
    'learning.copied': 'Lesson link copied.',
    'learning.copyFailed': 'Automatic copy was unavailable; the current URL already contains the lesson state.',
    'learning.annotationsOn': 'Annotations: On',
    'learning.annotationsOff': 'Annotations: Off',
    'learning.annotationAria': 'Open lesson for {label}',
    'learning.annotationLayerAria': 'Educational annotation points',
    'learning.unavailable': 'Learning unavailable',
    'learning.unavailableDescription': 'This mode requires the verified re-authored educational GLB with semantic assemblies.',
    'learning.lesson.base.title': 'Lesson 1 · Base assembly',
    'learning.lesson.base.body': 'Observe the lowest region of the digital model and its positional relationship to the complete vehicle. Lesson boundaries are display-oriented educational geometry.',
    'learning.lesson.lower.title': 'Lesson 2 · Lower body assembly',
    'learning.lesson.lower.body': 'Explore the lower body as an independent display region for selection, isolation, and digital section-view practice.',
    'learning.lesson.center.title': 'Lesson 3 · Center body assembly',
    'learning.lesson.center.body': 'Use the central region as a reference for comparing the lower and upper assemblies. Ghost mode preserves spatial context while focusing attention.',
    'learning.lesson.upper.title': 'Lesson 4 · Upper body assembly',
    'learning.lesson.upper.body': 'Inspect the upper body in context and see how it is represented as an independent semantic subtree in the educational GLB.',
    'learning.lesson.nose.title': 'Lesson 5 · Nose / spacecraft-side assembly',
    'learning.lesson.nose.body': 'Inspect the top visual region of the digital model. The lesson label describes an educational display region, not a historical staging boundary or real-world assembly procedure.',
  },
}

const entityTranslations = {
  vi: {
    'base-assembly': ['Cụm đáy', 'Vùng trực quan thấp nhất của mô hình giáo dục, được tạo thành một nhánh có thể biến đổi độc lập.'],
    'lower-body-assembly': ['Cụm thân dưới', 'Vùng thân dưới được tách số hóa để quan sát và trình bày lắp/tách có thể đảo ngược.'],
    'center-body-assembly': ['Cụm thân giữa', 'Vùng trực quan trung tâm dùng làm mốc trung tính trong chế độ tách cụm.'],
    'upper-body-assembly': ['Cụm thân trên', 'Vùng thân trên được tạo thành một nhánh giáo dục có thể biến đổi độc lập.'],
    'nose-stack-assembly': ['Cụm mũi / phía tàu vũ trụ', 'Vùng trực quan phía trên của mô hình nhập, được tách để trình bày mà không khẳng định ranh giới tầng lịch sử.'],
    'base-hardware': ['Phần cứng đáy và cánh ổn định', 'Các đối tượng bên ngoài được tuyển chọn quanh phần đáy mô hình NASA. Đây là nhóm hiển thị giáo dục, không phải khẳng định về ranh giới tách tầng.'],
    'lower-body-details': ['Chi tiết ngoài thân dưới', 'Hai đối tượng ngoài hẹp kéo dài qua phần thân dưới, được giữ riêng khỏi vỏ chính để quan sát.'],
    'mid-body-details': ['Chi tiết ngoài thân giữa', 'Hai đối tượng ngoài hẹp tập trung quanh vùng giữa-trên. Nhóm này chỉ mang tính mô tả và không khẳng định danh tính tầng lịch sử.'],
    'upper-exterior-details': ['Chi tiết ngoài thân trên', 'Các đối tượng ngoài nhỏ tập trung gần đầu trên của mô hình nhập, chỉ được nhóm để chọn và quan sát.'],
    'primary-body-shell': ['Vỏ thân chính', 'Đối tượng thân chính trong tài nguyên trình bày, kéo dài gần toàn bộ mô hình; vì vậy GLB gốc không thể tách trung thực các tầng lịch sử chỉ bằng phép biến đổi node.'],
    'upper-module': ['Mô-đun trên', 'Nhóm trực quan phía trên dùng để minh họa chọn và tách cụm.'],
    'upper-stage': ['Vỏ cụm trên', 'Nhóm hình trụ phía trên dạng tổng quát, chỉ dùng để trực quan hóa.'],
    'middle-stage': ['Vỏ cụm giữa', 'Nhóm giữa dạng tổng quát dùng cho tương tác ẩn, cô lập và X-quang.'],
    'lower-stage': ['Vỏ cụm dưới', 'Nhóm thân dưới dạng tổng quát cho nguyên mẫu cấu trúc tương tác.'],
    'aft-section': ['Nhóm trực quan phía đáy', 'Nhóm trực quan phía đáy; không mô phỏng hành vi động lực hoặc quy trình chế tạo.'],
  },
  en: {
    'base-assembly': ['Base assembly', 'Lowest visual region of the educational model, authored as an independently transformable subtree.'],
    'lower-body-assembly': ['Lower body assembly', 'Lower body region digitally separated for inspection and reversible assembly/explode presentation.'],
    'center-body-assembly': ['Center body assembly', 'Central visual region used as the neutral reference in exploded presentation mode.'],
    'upper-body-assembly': ['Upper body assembly', 'Upper body region authored as an independently transformable educational subtree.'],
    'nose-stack-assembly': ['Nose / spacecraft-side assembly', 'Top visual region of the imported model, separated for display without asserting a historical stage boundary.'],
    'base-hardware': ['Base hardware and fins', 'Curated exterior objects around the base of the NASA model; an educational display group, not a historical staging claim.'],
    'lower-body-details': ['Lower body exterior details', 'Two narrow exterior objects spanning the lower body, kept separate from the primary shell for inspection.'],
    'mid-body-details': ['Mid-body exterior details', 'Two narrow exterior objects concentrated around the mid-upper region; descriptive only, not a historical stage identity.'],
    'upper-exterior-details': ['Upper exterior details', 'Small exterior objects near the top of the imported model, grouped only for selection and inspection.'],
    'primary-body-shell': ['Primary body shell', 'The main body object in the presentation asset spans almost the full model, so historical stages cannot be detached faithfully using node transforms alone.'],
    'upper-module': ['Upper module', 'Generic upper visual group used to demonstrate selection and separation.'],
    'upper-stage': ['Upper shell group', 'Generic upper cylindrical group used only for visualization.'],
    'middle-stage': ['Middle shell group', 'Generic middle group used for hide, isolate, and X-ray interaction.'],
    'lower-stage': ['Lower shell group', 'Generic lower body group used by the interactive structure prototype.'],
    'aft-section': ['Aft visual group', 'Generic visual group at the base; it does not model propulsion behavior or manufacturing procedures.'],
  },
}

let currentLanguage = DEFAULT_LANGUAGE
const listeners = new Set()

function interpolate(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`))
}

export function getLanguage() { return currentLanguage }

export function t(key, vars = {}) {
  const template = messages[currentLanguage]?.[key] ?? messages[DEFAULT_LANGUAGE]?.[key] ?? key
  return interpolate(template, vars)
}

export function entityLabel(id, fallback = id) {
  return entityTranslations[currentLanguage]?.[id]?.[0] ?? fallback
}

export function entityDescription(id, fallback = '') {
  return entityTranslations[currentLanguage]?.[id]?.[1] ?? fallback
}

export function applyStaticTranslations(root = document) {
  root.querySelectorAll?.('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n) })
  root.querySelectorAll?.('[data-i18n-aria-label]').forEach(node => { node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel)) })
  const description = document.querySelector('meta[name="description"]')
  if (description) description.setAttribute('content', t('app.metaDescription'))
  document.title = t('app.title')
}

function renderLanguageSwitcher() {
  document.querySelectorAll?.('[data-language]').forEach(button => {
    const active = button.dataset.language === currentLanguage
    button.setAttribute('aria-pressed', String(active))
    button.dataset.active = String(active)
  })
  const group = document.querySelector('.language-switcher')
  if (group) group.setAttribute('aria-label', t('language.group'))
}

export function setLanguage(language, { persist = true, notify = true, syncUrl = true } = {}) {
  const next = SUPPORTED.has(language) ? language : DEFAULT_LANGUAGE
  currentLanguage = next
  document.documentElement.lang = next
  if (persist) {
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}
  }
  if (syncUrl) {
    try {
      const url = new URL(location.href)
      url.searchParams.set('lang', next)
      history.replaceState(history.state, '', url)
    } catch {}
  }
  applyStaticTranslations()
  renderLanguageSwitcher()
  if (notify) listeners.forEach(listener => listener(next))
  return next
}

export function onLanguageChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function initializeI18n() {
  let preferred = DEFAULT_LANGUAGE
  try {
    const queryLanguage = new URLSearchParams(location.search).get('lang')
    if (SUPPORTED.has(queryLanguage)) preferred = queryLanguage
    else {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (SUPPORTED.has(stored)) preferred = stored
    }
  } catch {}
  document.querySelectorAll?.('[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language))
  })
  return setLanguage(preferred, { persist: false, notify: false, syncUrl: false })
}
