# Chiến lược kiểm thử

## Các lớp kiểm thử

1. **Unit/domain** — `tests/*.test.mjs`: state machine, semantic mapping, timeline, section, guided learning/deep-link, GLB parsing/re-authoring.
2. **Contract/integration** — các test `phase*-contract.test.mjs`: bảo vệ hợp đồng giữa renderer, asset và UI.
3. **E2E** — `e2e/app.spec.mjs` + `e2e/learning.spec.mjs`: tải GLB thật, VI/EN, timeline, mặt cắt, guided lesson/deep-link, annotation, responsive và fallback fail-closed.

## Lệnh chính

```bash
npm test
npm run verify:phase6
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
