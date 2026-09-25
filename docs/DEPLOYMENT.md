# CI/CD và triển khai

## CI là điều kiện phát hành lên Pages

[CI](../.github/workflows/ci.yml) sở hữu các kiểm tra lint, build/domain Node 22/24,
E2E/accessibility và visual. [Pages](../.github/workflows/pages.yml) chỉ tiếp tục sau
khi CI của đúng commit trên `main` đã kết thúc thành công; không còn deploy độc lập
ngay khi push. Mục tiêu là không đưa một revision còn chờ kiểm thử tương tác lên trang live.

[`qualifyPages`](../scripts/lib/pages-ci-gate.mjs) là nơi định nghĩa điều kiện chấp
nhận và [`check-pages-ci.mjs`](../scripts/check-pages-ci.mjs) là điểm chạy kiểm chứng.
Các trường hợp phải chặn nằm trong [bộ kiểm thử gate](../tests/pages-ci-gate.test.mjs).
Chỉ dùng CI `push` từ chính repository, không dùng kết quả PR/fork hoặc một run xanh
cũ để thay cho run mới hơn còn đỏ/đang chạy. Kiểm tra thiếu dữ liệu hoặc API lỗi phải
chặn thay vì suy đoán thành công.

## Chạy tự động và chạy lại thủ công

Sau khi CI hoàn tất, xem **Actions → Deploy GitHub Pages** để theo dõi gate, build,
deploy và smoke. Mỗi gate ghi SHA, CI run/attempt và thời điểm kiểm tra trong Summary.
Build, artifact, deploy và smoke đều gắn với SHA đã được chấp nhận, không checkout
một `main` có thể thay đổi giữa các job.

**Run workflow → main** dùng để thử triển khai lại revision hiện tại sau khi CI xanh;
đây không phải đường bỏ qua CI. Nếu gate chặn vì `STALE_MAIN`, chờ CI của main mới
hoàn tất. Nếu CI đỏ, sửa lỗi và chạy CI trước. Nếu quyền đọc API lỗi, sửa quyền thay
vì tắt gate. Không dùng chức năng này để rollback sang commit khác.

Main và CI được đọc lại ngay trước bước triển khai để phát hiện thay đổi trong lúc
build hoặc đợi environment approval. Đây là kiểm tra tại hai thời điểm, không phải
khóa giao dịch giữa Git refs và API Pages; push xảy ra sau lần kiểm cuối vẫn là một
race bên ngoài workflow. Các lượt Pages được tuần tự hóa để một event cũ không hủy
lượt triển khai mới.

## Quyền và artifact

Chỉ job `deploy` được cấp `pages: write` và `id-token: write`. Gate chỉ đọc metadata;
build chỉ đọc source/Pages và không dùng artifact từ PR/fork. Artifact được build và
upload trong chính lượt Pages đã qua gate. Không thay đổi golden snapshots hoặc tạo
branch/release khi triển khai.

Pages vẫn build lại từ source đã kiểm; điều này chưa chứng minh byte của một artifact
build trước đó trong CI chính là byte được deploy. Không coi commit identity là phép
so sánh byte artifact. [Nghiệm thu production](TESTING.md#nghiệm-thu-production-thủ-công)
là bước riêng để đối chiếu tài nguyên live và các tương tác sau triển khai.

## Smoke và thiết lập ban đầu

Smoke chạy sau deploy với URL trả về từ Pages; nó kiểm app shell, không thay thế
nghiệm thu thiết bị vật lý. Xem [script smoke](../scripts/smoke-deployed.mjs).

Repository cần chọn **Settings → Pages → Build and deployment → Source → GitHub Actions**
một lần. [Hướng dẫn thiết lập](GITHUB_PAGES_SETUP.md) là điểm tra cứu khi Pages chưa bật.

Nguồn về cơ chế và giới hạn bảo mật:
[workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run),
[Pages action](https://github.com/actions/deploy-pages).
