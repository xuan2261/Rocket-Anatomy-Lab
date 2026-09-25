# Chiến lược kiểm thử

## Các lớp kiểm thử

1. **Unit/domain** — `tests/*.test.mjs`: state machine, semantic mapping, timeline, section, guided learning/deep-link, GLB parsing/re-authoring.
2. **Contract/integration** — các test `phase*-contract.test.mjs`: bảo vệ hợp đồng giữa renderer, asset và UI.
3. **E2E** — `e2e/app.spec.mjs` + `e2e/learning.spec.mjs`: tải GLB thật, VI/EN, timeline, mặt cắt, guided lesson/deep-link, annotation, responsive và fallback fail-closed.

## Lệnh chính

```bash
npm test
npm run verify:phase7
npm run check:localization
npm run test:e2e
```

Trong CI, Playwright chạy 1 worker để tăng tính ổn định. Báo cáo HTML được upload thành artifact khi job E2E chạy.

## Kiểm thử song ngữ

- `npm run check:localization` kiểm contract VI/EN, tiêu đề chính, `html[lang]`, persistence hook và các controller động.
- `tests/i18n-contract.test.mjs` kiểm chuyển `vi ↔ en`, localStorage, entity label và touch target của switch.
- Playwright E2E chuyển VI → EN, tải lại trang để kiểm persistence, rồi chuyển EN → VI.
- Tiêu đề lớn bắt buộc: `Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ`.


## Kiểm thử Phase 6 — Guided Learning

- `tests/learning.test.mjs`: lesson state, next/previous, manifest, deep-link và preset mặt cắt chuẩn hóa.
- `tests/phase6-contract.test.mjs`: disclosure semantics, touch target 44 px, projection annotation, fallback fail-closed và không phụ thuộc raw NASA node names.
- `e2e/learning.spec.mjs`: mở deep-link `?lesson=...&lang=...`, áp dụng learning view, kiểm Section preset, annotation toggle và screenshot evidence.
- Screenshot được đính kèm vào Playwright report. Pixel-baseline regression chỉ nên bật sau khi baseline được tạo trong cùng môi trường CI để tránh sai khác OS/browser.


## Phase 7 — Accessibility + Visual Regression

### Accessibility

```bash
npm run test:a11y
```

`e2e/accessibility.spec.mjs` dùng `@axe-core/playwright` và chạy các tag WCAG A/AA cho hai locale VI/EN. Vì Playwright config có hai projects, mỗi locale được kiểm trên desktop Chromium và mobile Chromium.

Automated axe scan chỉ phát hiện được một phần vấn đề accessibility; manual review vẫn cần thiết cho keyboard flow, semantics, đọc màn hình và trải nghiệm thực tế.

### Visual regression

```bash
npm run test:visual
```

Golden files nằm tại `e2e/visual.spec.mjs-snapshots/`:

- shell-en-desktop-chromium-linux.png
- shell-en-mobile-chromium-linux.png
- shell-vi-desktop-chromium-linux.png
- shell-vi-mobile-chromium-linux.png

Golden snapshots được sinh trên Ubuntu 24.04/Chromium trong GitHub Actions, không sinh từ máy local. Visual CI lane cũng chạy trên Ubuntu 24.04 để giảm drift môi trường.

WebGL canvas và annotation overlay được mask; functional E2E tiếp tục kiểm renderer thật. Visual regression tập trung vào layout, text, control states và responsive UI.

## Nghiệm thu production thủ công

Mở **Actions → Production browser acceptance → Run workflow**, chọn **main**.
[Workflow](../.github/workflows/production-acceptance.yml) là điểm chạy chính;
[script nghiệm thu](../scripts/accept-production.mjs) sở hữu ma trận kiểm tra.
Không cần mở phiên trên điện thoại hoặc máy tính cá nhân để chạy bộ tự động này.

Để trống `expected_revision` khi kiểm bản main vừa triển khai. Chỉ nhập một commit
SHA đầy đủ khi cần đối chiếu mốc cũ; mốc đó phải là ancestor và phần source ứng dụng
phải còn tương đương với checkout hiện tại. Chạy sau khi Pages deploy hoàn tất.
Nếu tài nguyên live khác mốc kiểm, kết quả bị chặn thay vì tự chấp nhận baseline mới.

Báo cáo và ảnh nằm trong **Summary / Artifacts** của chính workflow run, không nằm
trong branch QA mới. Mỗi run/attempt có artifact riêng, giữ 30 ngày. Bằng chứng cũ
trong `docs/acceptance/` được giữ nguyên; không ghi đè nó khi kiểm lại production.
Workflow nghiệm thu không commit, push, tạo branch, triển khai Pages hoặc phát hành.

Kết quả PASS chỉ áp dụng cho bộ tự động được ghi trong artifact. Mobile là giả lập
Chromium; nghiệm thu thiết bị vật lý, pinch, GPU/driver và công nghệ hỗ trợ vẫn là
các mục riêng chưa xác minh. Không suy diễn `axe` không có violations thành việc
đã đạt toàn bộ accessibility, đặc biệt khi còn mục `incomplete`.

Các điều kiện từ chối và bảo vệ đầu ra nằm trong
[`tests/production-acceptance.test.mjs`](../tests/production-acceptance.test.mjs).
Cách kích hoạt được đối chiếu với [hướng dẫn GitHub về workflow thủ công](https://docs.github.com/actions/managing-workflow-runs/manually-running-a-workflow).

## Kiểm tra cấu hình GitHub Actions trước build

Lỗi workflow cần được phát hiện trước khi tải dependency hoặc khởi chạy trình duyệt.
[`scripts/lint-workflows.sh`](../scripts/lint-workflows.sh) là điểm chạy chung của
CI, Pages và nghiệm thu production; CI chặn các job phía sau bằng `needs`.
Chạy cùng phép kiểm trên Linux x86_64 với Bash, Node.js, curl, tar và sha256sum:

```bash
bash scripts/lint-workflows.sh
```

Installer ghim phiên bản và SHA-256 của bản phát hành chính thức, chỉ giải nén
sau khi checksum đúng, rồi xóa thư mục tạm kể cả khi thất bại. Lỗi tải công cụ
không được coi là lint thành công. Không cần cài các package của ứng dụng.

Phạm vi là kiểm tra tích hợp sẵn của [actionlint](https://github.com/rhysd/actionlint):
YAML, schema Actions, expression, context, permission và phụ thuộc job. Các tích hợp
ShellCheck/Pyflakes không thuộc gate này. Lint không thay thế chạy CI thật, kiểm
quyền tài khoản, hay nghiệm thu thiết bị. Workflow sai cú pháp nghiêm trọng vẫn có
thể bị GitHub từ chối trước khi job chạy; kiểm local trước khi push giúp tránh điều đó.

[`scripts/check-actionlint-fixtures.mjs`](../scripts/check-actionlint-fixtures.mjs)
chạy chính binary với các mẫu hợp lệ và lỗi hồi quy;
[`tests/workflow-lint.test.mjs`](../tests/workflow-lint.test.mjs) giữ hợp đồng chặn job
và từ chối download lỗi. Bằng chứng các lần chạy nằm ở log của job, không tự tạo
branch hoặc commit kết quả vào repository.
