# CI/CD và triển khai

## CI

Workflow `.github/workflows/ci.yml` chạy khi push lên `main`, nhánh `feat/**`, `fix/**` và khi mở Pull Request vào `main`.

- Build + unit/integration trên Node 22 và 24.
- E2E + axe accessibility trên Chromium bằng Playwright.
- Visual regression trên Ubuntu 24.04 bằng CI-native golden snapshots.
- Upload Playwright reports để điều tra khi E2E/visual lỗi.

## CD / GitHub Pages

Workflow `.github/workflows/pages.yml` chạy khi push vào `main` và có thể chạy thủ công. Nó chạy `verify:ci` (bao gồm tải/kiểm source NASA và sinh GLB giáo dục), rồi đóng gói thư mục `public/`, rồi deploy bằng GitHub Pages Actions chính thức.

Lần đầu cần vào **Settings → Pages → Build and deployment → Source → GitHub Actions** nếu repository chưa bật Pages theo workflow.


## Smoke-test sau deploy

Khi deploy Pages thành công, job `smoke` chạy `npm run smoke:deployed` với URL lấy trực tiếp từ output của `actions/deploy-pages`.

Smoke kiểm HTTP, title, viewport, VI/EN controls, Guided Learning control và module `bootstrap.mjs`. Job chỉ chạy sau `deploy`, vì vậy không thể báo xanh khi Pages chưa thực sự triển khai.

## Trạng thái prerequisite Pages

Workflow không thể tự tạo/bật GitHub Pages site bằng quyền connector hiện có. Repository cần cấu hình một lần:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

Sau đó workflow hiện tại sẽ build → deploy → smoke tự động trên mỗi push `main`.
