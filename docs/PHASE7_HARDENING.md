# Phase 7 — Quality & Deployment Hardening

## Mục tiêu

Phase 7 không thay đổi logic 3D. Mục tiêu là biến các đặc tính chất lượng đã có thành gate tự động, có bằng chứng và fail-closed:

- accessibility automation bằng axe trong Playwright;
- visual regression có golden snapshot sinh từ CI;
- smoke-test sau khi GitHub Pages deploy;
- contract test bảo vệ cấu hình CI/CD.

## Accessibility

`e2e/accessibility.spec.mjs` chạy trên cả hai Playwright projects hiện có (desktop Chromium và Pixel 7/mobile Chromium) và cho hai locale `vi` / `en`.

Axe được giới hạn vào các tag WCAG A/AA được Playwright documentation minh họa:

- `wcag2a`
- `wcag2aa`
- `wcag21a`
- `wcag21aa`

Automated axe scan là gate bắt buộc nhưng không thay thế manual accessibility review.

## Visual regression

`e2e/visual.spec.mjs` kiểm hai giao diện VI/EN trên desktop và mobile.

Để giảm biến động không liên quan:

- `prefers-reduced-motion: reduce`;
- animation bị disable khi chụp;
- WebGL canvas và annotation overlay được mask;
- so sánh tập trung vào UI chrome, typography, spacing và responsive layout.

Bốn golden PNG được sinh trên **Ubuntu 24.04 + Chromium trong GitHub Actions**, rồi commit trực tiếp từ workflow CI-native baseline generator. Workflow generator đã bị xóa sau khi hoàn tất để tránh tự cập nhật golden ngoài review.

CI chính chạy visual regression trên cùng `ubuntu-24.04`.

## Deployment smoke

Sau khi `actions/deploy-pages` thành công, job `smoke` dùng `SMOKE_URL` từ output `page_url` và kiểm:

- HTTP thành công;
- đúng title;
- viewport;
- VI/EN controls;
- Guided Learning control;
- `bootstrap.mjs` truy cập được.

Smoke chỉ chạy sau deploy nên fail-closed nếu Pages chưa được bật.

## Commands

```bash
npm run verify:phase7
npm run test:a11y
npm run test:e2e
npm run test:visual
npm run test:all
```

## Pages prerequisite

GitHub Pages vẫn cần được bật một lần tại **Settings → Pages → Build and deployment → Source → GitHub Actions**. Đây là repository setting, không phải lỗi workflow.
