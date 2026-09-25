# CI/CD và triển khai

## CI là điều kiện phát hành lên Pages

[CI](../.github/workflows/ci.yml) sở hữu các kiểm tra lint, build/domain Node 22/24,
E2E/accessibility và visual. [Pages](../.github/workflows/pages.yml) chỉ tiếp tục sau
khi CI của đúng commit trên `main` đã kết thúc thành công và có artifact đã kiểm; không còn deploy độc lập
ngay khi push. Mục tiêu là không đưa một revision còn chờ kiểm thử tương tác lên trang live.

[`qualifyPages`](../scripts/lib/pages-ci-gate.mjs) là nơi định nghĩa điều kiện chấp
nhận và [`check-pages-ci.mjs`](../scripts/check-pages-ci.mjs) là điểm chạy kiểm chứng.
Các trường hợp phải chặn nằm trong [bộ kiểm thử gate](../tests/pages-ci-gate.test.mjs).
Chỉ dùng CI `push` từ chính repository, không dùng kết quả PR/fork hoặc một run xanh
cũ để thay cho run mới hơn còn đỏ/đang chạy. Kiểm tra thiếu dữ liệu hoặc API lỗi phải
chặn thay vì suy đoán thành công.

## Chạy tự động và chạy lại thủ công

Sau khi CI hoàn tất, xem **Actions → Deploy GitHub Pages** để theo dõi gate, promote,
deploy và smoke. Mỗi gate ghi SHA, CI run/attempt và thời điểm kiểm tra trong Summary.
Artifact, deploy và smoke đều gắn với SHA đã được chấp nhận, không checkout
một `main` có thể thay đổi giữa các job.

**Run workflow → main** dùng để thử triển khai lại revision hiện tại sau khi CI xanh;
đây không phải đường bỏ qua CI. Nếu gate chặn vì `STALE_MAIN`, chờ CI của main mới
hoàn tất. Nếu CI đỏ, sửa lỗi và chạy CI trước. Nếu quyền đọc API lỗi, sửa quyền thay
vì tắt gate. Không dùng chức năng này để rollback sang commit khác.

Main và CI được đọc lại ngay trước bước triển khai để phát hiện thay đổi trong lúc
chuyển artifact hoặc đợi environment approval. Đây là kiểm tra tại hai thời điểm, không phải
khóa giao dịch giữa Git refs và API Pages; push xảy ra sau lần kiểm cuối vẫn là một
race bên ngoài workflow. Các lượt Pages được tuần tự hóa để một event cũ không hủy
lượt triển khai mới.

## Quyền và artifact

Chỉ job `deploy` được cấp `pages: write` và `id-token: write`. Gate chỉ đọc metadata;
không dùng artifact từ PR/fork. [Bộ chọn artifact](../scripts/lib/tested-artifact.mjs)
ràng buộc ID bất biến với đúng CI run/attempt đã được chấp nhận.
Không thay đổi golden snapshots hoặc tạo branch/release khi triển khai.

## Build một release candidate, kiểm và deploy cùng payload

Output Node 22 sau qualification là nguồn duy nhất của release candidate. Node 24
vẫn build/kiểm tương thích riêng, nhưng output đó không dùng để phát hành. E2E và
visual tải candidate về, chạy trên bản giải nén ngoài source rồi đối chiếu lại toàn
bộ tệp. Chỉ sau khi cả hai lane đạt mới công bố bundle đã kiểm.

[`site_artifact.py`](../scripts/site_artifact.py) sở hữu manifest SHA-256, kiểm archive,
biên nhận hai lane và phép đối chiếu live. [Test hợp đồng](../tests/release-flow.test.mjs)
giữ thứ tự CI và cấm build/repack trong Pages; [test integrity](../tests/site_artifact_test.py)
giữ các trường hợp phải từ chối khi byte hoặc nguồn gốc sai.

Pages không cài dependency, compile, fetch lại asset hay đóng tar mới. `deploy-pages`
chọn artifact trong chính workflow của nó, nên payload `artifact.tar` được chuyển
nguyên byte sang một transport artifact tại lượt Pages. **Artifact ID và ZIP wrapper
có thể khác; SHA-256 của tar phải giống hệt.** Manifest và biên nhận giữ liên hệ với
artifact nguồn, không được hiểu là một chữ ký/attestation supply-chain độc lập.

Artifact và biên nhận phải thuộc cùng CI attempt. Khi cần chạy lại, dùng **Re-run all
jobs** để tạo một tập bằng chứng đầy đủ; không ghép candidate của attempt cũ với
biên nhận mới. Nếu artifact đã hết hạn/xóa hoặc thiếu bằng chứng, chạy lại CI;
Pages không được build lại hoặc tìm một artifact gần giống để thay thế.

Smoke đối chiếu mọi tệp tĩnh trong manifest với byte nhận từ trang live, sau đó kiểm
app shell. Phép đối chiếu này không bao gồm byte của các CDN bên ngoài được trang
tham chiếu, không thay thế nghiệm thu thiết bị, và không khóa mọi thay đổi có thể
xảy ra sau lần kiểm cuối. [Nghiệm thu production](TESTING.md#nghiệm-thu-production-thủ-công)
vẫn là bước riêng cho một phiên tương tác live.

## Smoke và thiết lập ban đầu

Smoke chạy sau deploy, kiểm byte artifact và app shell; không thay thế
nghiệm thu thiết bị vật lý. Xem [script smoke](../scripts/smoke-deployed.mjs).

Repository cần chọn **Settings → Pages → Build and deployment → Source → GitHub Actions**
một lần. [Hướng dẫn thiết lập](GITHUB_PAGES_SETUP.md) là điểm tra cứu khi Pages chưa bật.

Nguồn về cơ chế và giới hạn bảo mật:
[workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run),
[Pages action](https://github.com/actions/deploy-pages).
