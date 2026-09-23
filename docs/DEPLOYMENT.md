# CI/CD và triển khai

## CI

Workflow `.github/workflows/ci.yml` chạy khi push lên `main`, nhánh `feat/**`, `fix/**` và khi mở Pull Request vào `main`.

- Build + unit/integration trên Node 22 và 24.
- E2E trên Chromium bằng Playwright.
- Upload `playwright-report` để điều tra khi E2E lỗi.

## CD / GitHub Pages

Workflow `.github/workflows/pages.yml` chạy khi push vào `main` và có thể chạy thủ công. Nó chạy `verify:ci` (bao gồm tải/kiểm source NASA và sinh GLB giáo dục), rồi đóng gói thư mục `public/`, rồi deploy bằng GitHub Pages Actions chính thức.

Lần đầu cần vào **Settings → Pages → Build and deployment → Source → GitHub Actions** nếu repository chưa bật Pages theo workflow.
