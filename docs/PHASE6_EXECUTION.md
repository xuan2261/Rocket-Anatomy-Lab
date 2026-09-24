# Phase 6 — Educational Annotations & Guided Learning

## Mục tiêu

Biến viewer từ công cụ quan sát 3D thành trải nghiệm học có hướng dẫn, vẫn giữ phạm vi dân sự/giáo dục và không đưa quy trình chế tạo/vận hành ngoài đời thực.

## Kiến trúc

```text
learningManifest.ts
      ↓
learning.ts (state + deep-link)
      ↓
learning-controller.mjs
  ├─ disclosure UI
  ├─ VI/EN lesson copy
  ├─ Previous / Next
  ├─ semantic selection + camera focus
  ├─ Section preset
  ├─ annotation overlay
  └─ URL state (?lesson=&lang=)
      ↓
real-app.mjs callbacks
```

## Lesson contract

Mỗi lesson chỉ tham chiếu semantic assembly ID đã xác minh. Preset Section dùng tọa độ chuẩn hóa 0..1 trên mô hình số và chỉ phục vụ trực quan hóa.

## Accessibility

- Lesson panel dùng disclosure button + `aria-expanded`.
- Annotation markers là native buttons, tối thiểu 44×44 px.
- Deep-link không reload nên không làm mất focus/context.
- VI/EN tiếp tục cập nhật `html[lang]`.
- Reduced-motion của timeline/camera vẫn là authority cho camera focus.

## Fail-closed

Fallback renderer tạo learning controller ở trạng thái disabled. Unknown lesson query không được áp dụng; core trả về bài mặc định mà không suy diễn ID.

## Verification gate

```bash
npm run build
npm test
npm run qualify:learning
npm run verify:phase6
npm run check:localization
npm run test:e2e
```

Playwright lưu screenshot evidence cho guided-learning flow. Pixel snapshot baseline chưa được coi là regression gate cho tới khi baseline được tạo/review trong cùng môi trường CI.
