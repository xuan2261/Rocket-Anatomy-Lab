# Chiến lược kiểm thử

## Các lớp kiểm thử

1. **Unit/domain** — `tests/*.test.mjs`: state machine, semantic mapping, timeline, section, GLB parsing/re-authoring.
2. **Contract/integration** — các test `phase*-contract.test.mjs`: bảo vệ hợp đồng giữa renderer, asset và UI.
3. **E2E** — `e2e/app.spec.mjs`: tải GLB thật, giao diện tiếng Việt, timeline, mặt cắt, reduced-motion, responsive và fallback fail-closed.

## Lệnh chính

```bash
npm test
npm run verify:phase5
npm run check:localization
npm run test:e2e
```

Trong CI, Playwright chạy 1 worker để tăng tính ổn định. Báo cáo HTML được upload thành artifact khi job E2E chạy.

## Kiểm thử song ngữ

- `npm run check:localization` kiểm contract VI/EN, tiêu đề chính, `html[lang]`, persistence hook và các controller động.
- `tests/i18n-contract.test.mjs` kiểm chuyển `vi ↔ en`, localStorage, entity label và touch target của switch.
- Playwright E2E chuyển VI → EN, tải lại trang để kiểm persistence, rồi chuyển EN → VI.
- Tiêu đề lớn bắt buộc: `Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ`.
