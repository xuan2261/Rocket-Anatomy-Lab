# 🚀 Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ

[![CI](https://github.com/xuan2261/Rocket-Anatomy-Lab/actions/workflows/ci.yml/badge.svg)](https://github.com/xuan2261/Rocket-Anatomy-Lab/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/xuan2261/Rocket-Anatomy-Lab/actions/workflows/pages.yml/badge.svg)](https://github.com/xuan2261/Rocket-Anatomy-Lab/actions/workflows/pages.yml)

**Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ** là ứng dụng trực quan hóa 3D mang mục đích **giáo dục về phương tiện phóng vũ trụ dân sự**, sử dụng mô hình Saturn V chính thức của NASA làm tài nguyên minh họa. Ứng dụng tập trung vào quan sát cấu trúc số hóa, tách cụm trực quan, trình bày có hướng dẫn và mặt cắt/cutaway.

> Các cụm trong ứng dụng là **vùng hình học phục vụ hiển thị** được tái cấu trúc từ mô hình nguồn. Chúng **không phải ranh giới tầng lịch sử** và không phải hướng dẫn lắp ráp ngoài đời thực.

## ✨ Tính năng

- Mô hình Saturn V 3D thật bằng **Three.js** và GLB.
- 5 cụm giáo dục có transform độc lập, hỗ trợ tách cụm có thể đảo ngược.
- Chọn cụm trực tiếp trên mô hình hoặc từ cây cấu trúc.
- Ẩn/hiện, cô lập, Bình thường/Bóng mờ/X-quang.
- Timeline trình bày số: Trước, Phát/Tạm dừng, Tiếp, Khởi động lại, đảo chiều tháo rời/lắp lại.
- Tôn trọng `prefers-reduced-motion`.
- Mặt cắt X/Y/Z, vị trí cắt, đảo hướng và **nắp trực quan** bằng stencil.
- Fallback fail-closed: tính năng yêu cầu GLB thật sẽ bị vô hiệu thay vì mô phỏng sai.
- Giao diện **song ngữ Việt/Anh (VI/EN)**, mặc định tiếng Việt, ghi nhớ lựa chọn bằng `localStorage` và cập nhật `html[lang]` cho công nghệ hỗ trợ.
- Responsive cho desktop/mobile/landscape; nút đổi ngôn ngữ có vùng tương tác tối thiểu 44×44 px.
- Test nhiều lớp: unit, integration/contract và E2E Playwright.
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
  └─ Section / Cutaway
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
│  └─ section-controller.mjs
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
npm run fetch:source
npm run qualify:real
npm run build
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

### Toàn bộ gate Phase 1 → Phase 5

```bash
npm run verify:phase5
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
- chạy E2E Chromium bằng Playwright;
- lưu Playwright HTML report thành artifact.

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

## 🌐 Ngôn ngữ

- Mặc định: **Tiếng Việt**.
- Nút `VI` / `EN` nằm ở thanh tiêu đề và đổi cả text tĩnh lẫn text động của renderer, Inspector, Timeline và Section/Cutaway.
- Lựa chọn được lưu trong `localStorage` và giữ nguyên sau khi tải lại trang.
- `document.documentElement.lang` được cập nhật thành `vi` hoặc `en` để screen reader dùng cách phát âm phù hợp.
- E2E kiểm cả chuyển ngôn ngữ, trạng thái `aria-pressed` và persistence qua reload.

## ♿ Accessibility

- Điều khiển chính có vùng tương tác tối thiểu 44×44 px.
- Native range giữ keyboard behavior.
- Nút có `aria-label`/`aria-pressed` phù hợp; nhóm chuyển ngôn ngữ cũng cập nhật ARIA theo locale.
- Canvas có mô tả truy cập.
- Timeline hỗ trợ reduced-motion.
- Layout không tràn ngang ở desktop/mobile/landscape đã kiểm.

## 📚 Tài liệu kỹ thuật

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/ASSEMBLY_PIPELINE.md`](docs/ASSEMBLY_PIPELINE.md)
- [`docs/ASSET_QUALIFICATION.md`](docs/ASSET_QUALIFICATION.md)
- [`docs/SEMANTIC_MAP.md`](docs/SEMANTIC_MAP.md)
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md)
- [`docs/TESTING.md`](docs/TESTING.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

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

1. Hoàn thiện annotation/callout giáo dục bằng dữ liệu semantic.
2. Guided lesson sử dụng lại timeline hiện tại.
3. Preset mặt cắt cho từng nội dung bài học.
4. Thêm một mô hình không gian dân sự thứ hai để kiểm tính tổng quát của viewer.
5. Tiếp tục tăng visual regression/a11y coverage trong CI.
