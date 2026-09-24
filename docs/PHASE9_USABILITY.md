# Phase 9 — Task-based usability validation

Ngày kiểm: 2026-09-24.

## Mục tiêu

Giữ 5 tác vụ thường dùng trong một vùng thao tác cố định quanh viewport và Control Center:

1. chọn một cụm;
2. đổi chế độ quan sát;
3. tiến một bước trình bày;
4. chuyển bài học;
5. bật mặt cắt.

Phase này thêm **automated usability guardrails**. Đây không phải thử nghiệm người dùng có người tham gia và không được diễn giải như dữ liệu hành vi con người.

## Acceptance gates

- Desktop/mobile không cuộn toàn trang trong 5 tác vụ chính.
- Viewport và Control Center cùng tồn tại trong viewport.
- Primary action của mỗi tác vụ nhìn thấy trước khi click; không cần cuộn panel để tìm.
- Tác vụ chọn đối tượng: tối đa 1 action từ trạng thái mặc định.
- Bốn tác vụ còn lại: tối đa 2 actions (chọn tab + hành động chính).
- Tablist dùng roving tabindex; phím mũi tên đổi tab, rồi Tab đi vào panel đang mở thay vì đi qua cả 5 tab.
- Skip link đưa keyboard focus đến viewport.
- Thiết bị coarse-pointer dùng target 48 px cho các control chính.
- Khoảng cách tab → hành động chính được ghi vào Playwright artifact như **geometric proxy**, không đặt ngưỡng chuẩn hóa giả tạo.

## Vì sao dùng các gate này

WCAG 2.2 yêu cầu target tối thiểu 24×24 CSS px hoặc thỏa điều kiện spacing; dự án vẫn giữ baseline 44 px và nâng lên 48 px trên coarse-pointer để ưu tiên thao tác cảm ứng. web.dev cũng khuyến nghị khoảng 48 device-independent pixels cho touch target.

WAI yêu cầu focus nhìn thấy được; project dùng focus-visible outline rõ. Control Center dùng semantic `button`/tab roles và roving tabindex để giảm số lần Tab không cần thiết.

Nguồn tham chiếu:

- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
- https://web.dev/articles/accessible-tap-targets
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
- https://playwright.dev/docs/locators

## Chạy

```bash
npm run test:usability
```

Suite cũng nằm trong `npm run test:e2e`, vì vậy CI lane E2E + accessibility sẽ chặn regression usability.

## Metrics

Mỗi project Playwright đính kèm artifact `phase9-usability-metrics` chứa:

- action count;
- khoảng cách hình học từ tab đến primary action;
- đường chéo Control Center;
- normalized pointer-distance proxy.

Metric khoảng cách chỉ dùng để so sánh regression giữa các revision; nó không thay thế usability study thực tế.

## Manual follow-up

Sau automated gate, bước đánh giá con người nên dùng cùng 5 task, quan sát:

- task success;
- hesitation / tìm sai tab;
- thao tác quay lại;
- cuộn panel;
- nhận biết Light/Dark;
- khả năng đọc label VI/EN;
- cảm nhận viewport có đủ lớn hay không.

Không thay đổi kiến trúc 3D hoặc semantic assembly contract trong Phase 9.
