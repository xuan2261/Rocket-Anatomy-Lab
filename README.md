# 🚀 Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ

[![CI](https://github.com/xuan2261/Rocket-Anatomy-Lab/actions/workflows/ci.yml/badge.svg)](https://github.com/xuan2261/Rocket-Anatomy-Lab/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/xuan2261/Rocket-Anatomy-Lab/actions/workflows/pages.yml/badge.svg)](https://github.com/xuan2261/Rocket-Anatomy-Lab/actions/workflows/pages.yml)

> 🌐 **Xem trực tiếp sau khi bật GitHub Pages:** https://xuan2261.github.io/Rocket-Anatomy-Lab/  
> Hướng dẫn bật Pages, deploy và kiểm smoke: [`docs/GITHUB_PAGES_SETUP.md`](docs/GITHUB_PAGES_SETUP.md).

**Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ** là ứng dụng trực quan hóa 3D mang mục đích **giáo dục về phương tiện phóng vũ trụ dân sự**, sử dụng mô hình Saturn V chính thức của NASA làm tài nguyên minh họa. Ứng dụng tập trung vào quan sát cấu trúc số hóa, tách cụm trực quan, trình bày có hướng dẫn và mặt cắt/cutaway.

> Các cụm trong ứng dụng là **vùng hình học phục vụ hiển thị** được tái cấu trúc từ mô hình nguồn. Chúng **không phải ranh giới tầng lịch sử** và không phải hướng dẫn lắp ráp ngoài đời thực.

> Chế độ **Giải phẫu NASA** là lớp kiến thức tham chiếu tách biệt: tên tầng/hệ thống đến từ nguồn NASA, còn vị trí highlight/cut trên GLB chỉ là neo trực quan gần đúng.

## ✨ Tính năng

- Mô hình Saturn V 3D thật bằng **Three.js** và GLB.
- 5 cụm giáo dục có transform độc lập, hỗ trợ tách cụm có thể đảo ngược.
- Chọn cụm trực tiếp trên mô hình hoặc từ cây cấu trúc.
- Ẩn/hiện, cô lập, Bình thường/Bóng mờ/X-quang.
- Timeline trình bày số: Trước, Phát/Tạm dừng, Tiếp, Khởi động lại, đảo chiều tháo rời/lắp lại.
- Tôn trọng `prefers-reduced-motion`.
- Mặt cắt X/Y/Z, vị trí cắt, đảo hướng và **nắp trực quan** bằng stencil.
- **Guided Learning Phase 6**: 5 bài học semantic VI/EN, annotation 3D, Previous/Next, focus camera, preset Section/Cutaway và deep-link chia sẻ trạng thái bài học.
- **Deep Anatomy Phase 12**: chuyển giữa cây geometry thật và cây giải phẫu NASA nhiều cấp (S-IC, S-II, S-IVB, Instrument Unit, Apollo), có breadcrumb, nguồn NASA, focus vùng gần đúng và preset X-ray + section cut.
- **Anatomy Navigation Phase 13**: deep-link từng anatomy node, search VI/EN, Back/Forward, evidence drawer, viewport reference marker và camera bookmark gần đúng.
- **Procedural Detail Phase 14**: lớp 3D sơ đồ bổ sung bằng Three.js `InstancedMesh` + `EdgesGeometry`, clipping theo mặt cắt và bóc tách độc lập; luôn gắn nhãn minh họa, không phải geometry kỹ thuật/chế tạo.
- **Qualified Detail Phase 15**: Lunar Module GLB thật từ NASA được pin byte length + Git blob SHA, fetch fail-closed trong CI, lazy-load theo node `apollo-lm-sla`, ghost shell và clipping đồng bộ.
- Fallback fail-closed: tính năng yêu cầu GLB thật sẽ bị vô hiệu thay vì mô phỏng sai.
- Giao diện **song ngữ Việt/Anh (VI/EN)**, mặc định tiếng Việt, ghi nhớ lựa chọn bằng `localStorage` và cập nhật `html[lang]` cho công nghệ hỗ trợ.
- Theme **Light/Dark kiểu aerospace workstation**: neutral-first, một brand-blue chính, surface hierarchy rõ, tab segmented, layered shadow và primary action nổi bật; mobile rút gọn brand để ưu tiên viewport.
- Responsive cho desktop/mobile/landscape; điều khiển chính tối thiểu 44 px và tăng lên 48 px trên thiết bị coarse-pointer.
- Test nhiều lớp: unit, integration/contract, E2E Playwright, **axe WCAG A/AA**, **task-based usability guardrails** và visual regression VI/EN × Light/Dark trên desktop/mobile.
- CI GitHub Actions và CD lên GitHub Pages.

## 🧱 Kiến trúc

```text
NASA Saturn V.glb
      │
      ├─ kiểm fingerprint / provenance
      ▼
GLB re-authoring pipeline
      │
      ▼
saturn-v-education.glb
  ├─ 5 cụm giáo dục
  └─ metadata provenance
      │
      ▼
Three.js renderer
  ├─ Selection / Hide / Isolate
  ├─ Ghost / X-ray
  ├─ Exploded view
  ├─ Guided timeline
  ├─ Section / Cutaway
  ├─ Guided Learning / Annotations
  ├─ NASA reference anatomy drill-down
  ├─ Procedural schematic detail fallback
  └─ Qualified NASA detail packages
      │
      ▼
UI VI/EN + accessibility
```

Logic domain nằm trong `src/`; mã TypeScript được build sang `public/core/`. Renderer và controller UI nằm trong `public/`.

## 📁 Cấu trúc thư mục

```text
.
├─ .github/
│  ├─ workflows/ci.yml
│  ├─ workflows/pages.yml
│  └─ dependabot.yml
├─ e2e/                     # Playwright E2E
├─ public/                  # Ứng dụng tĩnh + GLB
│  ├─ assets/
│  ├─ core/                 # sinh bởi npm run build, không commit
│  ├─ real-app.mjs
│  ├─ timeline-controller.mjs
│  ├─ section-controller.mjs
│  ├─ learning-controller.mjs
│  ├─ anatomy-controller.mjs
│  ├─ procedural-detail-layer.mjs
│  └─ real-detail-loader.mjs
├─ scripts/                 # qualification/re-authoring/local server
├─ src/                     # domain logic TypeScript
├─ tests/                   # unit + contract/integration
├─ docs/
├─ playwright.config.mjs
└─ package.json
```

## 🛠️ Yêu cầu môi trường

- Node.js **22+**.
- npm 10+.
- Trình duyệt hỗ trợ WebGL.
- Internet khi chạy lần đầu để tải asset NASA đã pin và Three.js 0.186.0 từ jsDelivr.

## ▶️ Cài đặt và chạy

```bash
npm install
npm run build
npm run fetch:source
npm run fetch:detail-assets
npm run qualify:real
npm run serve
```

Mở:

```text
http://127.0.0.1:4174
```

## ✅ Kiểm thử

### Unit + integration/contract

```bash
npm test
```

### Toàn bộ gate Phase 1 → Phase 15

```bash
npm run verify:phase15
```

### Accessibility automation

```bash
npm run test:a11y
```

### Task-based usability regression

```bash
npm run test:usability
```

### Visual regression

```bash
npm run test:visual
```

### Kiểm giao diện song ngữ VI/EN

```bash
npm run check:localization
```

### E2E Playwright

Lần đầu:

```bash
npx playwright install chromium
```

Chạy:

```bash
npm run test:e2e
```

Xem report:

```bash
npm run test:e2e:report
```

Chi tiết: [`docs/TESTING.md`](docs/TESTING.md).

## 🔁 CI/CD

### CI

`.github/workflows/ci.yml`:

- build + verify trên Node 22 và 24;
- chạy toàn bộ unit/integration/contract;
- chạy E2E + accessibility Chromium bằng Playwright/axe;
- chạy visual regression riêng trên Ubuntu 24.04 với golden snapshots sinh từ CI;
- lưu Playwright reports thành artifacts.

### GitHub Pages

`.github/workflows/pages.yml` kiểm lại project trước khi deploy thư mục `public/`. Nếu Pages chưa được bật, chọn **Settings → Pages → Source → GitHub Actions** một lần.

Chi tiết: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## 🧪 Các gate tài nguyên 3D

Mô hình nguồn NASA được pin bằng provenance/fingerprint. Pipeline kiểm:

- GLB 2.0 hợp lệ;
- kích thước byte và SHA-256;
- scene/node/mesh inventory;
- 5 cụm giáo dục sau re-authoring;
- triangle conservation;
- metadata provenance;
- fail-closed nếu source drift.
- Lunar Module detail package: byte length + Git blob SHA + GLB v2 header/declared length trước khi Pages đóng gói asset.

## 🌐 Ngôn ngữ

- Mặc định: **Tiếng Việt**.
- Nút `VI` / `EN` nằm ở thanh tiêu đề và đổi cả text tĩnh lẫn text động của renderer, Inspector, Timeline và Section/Cutaway.
- Lựa chọn được lưu trong `localStorage` và giữ nguyên sau khi tải lại trang.
- `document.documentElement.lang` được cập nhật thành `vi` hoặc `en` để screen reader dùng cách phát âm phù hợp.
- E2E kiểm cả chuyển ngôn ngữ, trạng thái `aria-pressed` và persistence qua reload.

## 🎓 Bài học có hướng dẫn

- 5 lesson được khóa theo **semantic assembly ID**, không theo tên mesh thô.
- Annotation là các button 3D-projected có vùng bấm tối thiểu 44×44 px.
- Panel lesson dùng disclosure semantics với `aria-expanded`.
- Deep-link dạng `?lesson=<semantic-id>&lang=vi|en` cập nhật bằng History API mà không reload.
- Mỗi lesson có preset mặt cắt **chuẩn hóa theo mô hình số** để hỗ trợ quan sát; preset không đại diện thông số lắp ráp hay cấu tạo ngoài đời.
- Fallback renderer vô hiệu hóa learning controls thay vì mô phỏng semantic lesson không có dữ liệu xác minh.

## ♿ Accessibility

- Điều khiển chính có vùng tương tác tối thiểu 44 px; coarse-pointer tăng lên 48 px cho các control quan trọng.
- Native range giữ keyboard behavior.
- Nút có `aria-label`/`aria-pressed` phù hợp; nhóm chuyển ngôn ngữ cũng cập nhật ARIA theo locale.
- Canvas có mô tả truy cập.
- Timeline hỗ trợ reduced-motion.
- Axe tự động kiểm WCAG A/AA cho VI/EN trên desktop/mobile.
- Layout không tràn ngang ở desktop/mobile/landscape đã kiểm.
- Visual regression khóa UI chrome VI/EN × Light/Dark trên desktop/mobile bằng 8 golden snapshots CI-native.
- Usability regression giữ 5 tác vụ chính trong cùng Control Center, không yêu cầu cuộn toàn trang và kiểm keyboard path của tablist.

## 📚 Tài liệu kỹ thuật

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/ASSEMBLY_PIPELINE.md`](docs/ASSEMBLY_PIPELINE.md)
- [`docs/ASSET_QUALIFICATION.md`](docs/ASSET_QUALIFICATION.md)
- [`docs/SEMANTIC_MAP.md`](docs/SEMANTIC_MAP.md)
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md)
- [`docs/TESTING.md`](docs/TESTING.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/GITHUB_PAGES_SETUP.md`](docs/GITHUB_PAGES_SETUP.md)
- [`docs/PHASE7_HARDENING.md`](docs/PHASE7_HARDENING.md)
- [`docs/PHASE9_USABILITY.md`](docs/PHASE9_USABILITY.md)
- [`docs/PHASE12_DEEP_ANATOMY.md`](docs/PHASE12_DEEP_ANATOMY.md)
- [`docs/PHASE13_ANATOMY_NAVIGATION.md`](docs/PHASE13_ANATOMY_NAVIGATION.md)
- [`docs/PHASE14_PROCEDURAL_DETAIL.md`](docs/PHASE14_PROCEDURAL_DETAIL.md)
- [`docs/PHASE15_QUALIFIED_DETAIL_ASSETS.md`](docs/PHASE15_QUALIFIED_DETAIL_ASSETS.md)

## 🛰️ Nguồn mô hình NASA

- NASA 3D Resources / Saturn V.
- Nguồn được ghi trong manifest và `NOTICE.md`.
- Tài nguyên NASA không được repository này tái cấp phép theo MIT; xem hướng dẫn sử dụng truyền thông của NASA trước khi tái phân phối.

## 🔐 Phạm vi dự án

Dự án chỉ phục vụ **trực quan hóa và giáo dục dân sự**. Không mô phỏng quy trình chế tạo, động cơ, nhiên liệu, điều khiển bay hay hướng dẫn vận hành phương tiện ngoài đời thực.

## 📜 Giấy phép

- Mã nguồn: MIT — xem [`LICENSE`](LICENSE).
- Tài nguyên NASA/third-party: xem [`NOTICE.md`](NOTICE.md).

## 🗺️ Hướng phát triển

1. Bật GitHub Pages một lần trong Settings để CD + deployed smoke bắt đầu chạy.
2. Thực hiện manual accessibility review định kỳ bên cạnh axe automation.
3. Thêm một mô hình không gian dân sự thứ hai để kiểm tính tổng quát của viewer/lesson engine.
4. Tách lesson content thành data file có thể biên tập độc lập nếu số bài học tăng.
5. Tiếp tục mở rộng annotation/callout nhưng giữ semantic-ID contract.
