# Đóng góp cho Rocket Anatomy Lab

Cảm ơn bạn quan tâm đến dự án.

## Quy trình đề xuất

1. Tạo nhánh `feat/<ten-ngan>` hoặc `fix/<ten-ngan>`.
2. Giữ thay đổi trong phạm vi trực quan hóa/giáo dục dân sự.
3. Chạy `npm run verify:ci`.
4. Nếu thay đổi UI/interaction, chạy thêm `npm run test:e2e`.
5. Mở Pull Request vào `main`, mô tả phạm vi, bằng chứng test và ảnh nếu thay đổi giao diện.

## Quy ước chất lượng

- Không bỏ qua test đang fail.
- Không hard-code raw NASA node names vào UI/domain mới.
- Tính năng cần asset thật phải fail-closed khi asset không đạt qualification.
- Điều khiển tương tác phải có keyboard/focus/accessibility phù hợp.
- Chuỗi hiển thị cho người dùng ưu tiên tiếng Việt.
