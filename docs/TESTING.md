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
