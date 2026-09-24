# GitHub Pages — bật, deploy và xem trực tiếp

## URL xem trực tiếp

Sau khi GitHub Pages được bật và workflow deploy thành công, site của repository này sẽ dùng URL mặc định:

```text
https://xuan2261.github.io/Rocket-Anatomy-Lab/
```

Trong **Settings → Pages**, GitHub cũng hiển thị nút **Visit site** sau deployment đầu tiên thành công.

## 1. Bật GitHub Pages một lần

Repository đã có custom workflow `.github/workflows/pages.yml`, vì vậy **không chọn “Deploy from a branch”**.

Thao tác:

1. Mở repository `xuan2261/Rocket-Anatomy-Lab`.
2. Chọn **Settings**.
3. Ở thanh bên trái, trong **Code and automation** hoặc **Code, planning, and automation**, chọn **Pages**.
4. Trong **Build and deployment** → **Source**, chọn **GitHub Actions**.
5. Không cần tạo workflow mới vì repository đã có `.github/workflows/pages.yml`.

## 2. Chạy deploy

Sau khi bật Pages:

1. Mở tab **Actions**.
2. Chọn workflow **Deploy GitHub Pages**.
3. Chọn **Run workflow**.
4. Branch: **main**.
5. Chọn **Run workflow**.

Workflow hiện tại chạy theo thứ tự:

```text
verify:ci
  ↓
configure-pages
  ↓
upload-pages-artifact (public/)
  ↓
deploy-pages
  ↓
Smoke deployed Pages
```

Workflow cũng tự chạy lại khi có push mới vào `main`.

## 3. Điều kiện PASS

Deployment chỉ được coi là hoàn tất khi cả ba jobs sau xanh:

- `build`
- `deploy`
- `Smoke deployed Pages`

Smoke test sau deploy kiểm:

- HTTP phản hồi thành công;
- đúng title `Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ`;
- có viewport 3D;
- có switch VI/EN;
- có Guided Learning;
- module `bootstrap.mjs` tải được.

## 4. Kiểm trực tiếp

Sau khi workflow xanh:

- vào **Settings → Pages → Visit site**; hoặc
- mở trực tiếp:

```text
https://xuan2261.github.io/Rocket-Anatomy-Lab/
```

Có thể mất vài phút để CDN Pages cập nhật deployment mới.

## 5. Vì sao deploy hiện tại chưa chạy được?

Trước khi Pages được bật, repository vẫn PASS toàn bộ `verify:ci`, nhưng `actions/configure-pages` trả lỗi vì GitHub chưa có Pages site/configuration cho repository.

Đây là repository setting, không phải lỗi build của ứng dụng.

## 6. Project subpath đã được kiểm

Ứng dụng dùng đường dẫn tương đối như:

- `./styles.css`
- `./bootstrap.mjs`
- `./assets/saturn-v-education.glb`

Do đó ứng dụng phù hợp với project Pages path:

```text
/Rocket-Anatomy-Lab/
```

thay vì giả định website nằm ở root domain.

## 7. Nếu workflow vẫn lỗi sau khi bật Pages

Kiểm theo thứ tự:

1. **Settings → Pages → Source** phải là **GitHub Actions**.
2. Rerun workflow **Deploy GitHub Pages** trên branch `main`.
3. Job `build` phải qua `verify:ci`.
4. Job `deploy` phải có output `page_url`.
5. Job `Smoke deployed Pages` phải PASS.
6. Nếu GitHub vừa được bật Pages, đợi vài phút rồi rerun một lần.

Không chuyển sang `Deploy from a branch` vì repository này đã có custom Actions deployment pipeline.
