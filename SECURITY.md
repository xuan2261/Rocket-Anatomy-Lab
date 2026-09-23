# Chính sách bảo mật

## Báo cáo lỗ hổng

Không đăng công khai khóa, token, credential hoặc dữ liệu nhạy cảm trong Issue/PR. Nếu phát hiện lỗ hổng, hãy báo cho chủ repository qua kênh riêng phù hợp trên GitHub trước khi công bố chi tiết.

## Phạm vi

Dự án là ứng dụng tĩnh phía trình duyệt. Các thay đổi liên quan dependency, CI/CD, URL tài nguyên, HTML injection hoặc dynamic code phải được review kỹ và có test phù hợp.

## Nguyên tắc CI

Workflow chỉ cấp quyền tối thiểu cần thiết. Pull Request không được cấp quyền deploy Pages.
