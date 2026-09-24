# Đối soát nghiệm thu production

Mốc ứng dụng: `38292a53ce08cfaa865a530caf523b15b5419e5f`.
Run: https://github.com/xuan2261/Rocket-Anatomy-Lab/actions/runs/36063253528

## Kết quả đã đọc từ artifact

- 28/28 ca PASS, 0 FAIL: 20 ca tương tác (5 cụm × VI/EN × desktop/mobile giả lập) và 8 ca Guide (VI/EN × sáng/tối × desktop/mobile giả lập).
- 33/33 tài nguyên public/domain/GLB chính khớp byte trước phiên; 33/33 khớp sau phiên.
- 1.248 lượt response thuộc tập tài nguyên đã biết mà browser thực sự nhận được đều khớp SHA-256. Đây là lượt tải lặp, không phải 1.248 tệp khác nhau.
- 0 console.error/pageerror, 0 requestfailed, 0 lỗi hạ tầng.
- Có 4 cảnh báo `GPU stall due to ReadPixels`. Không kết luận đã đạt hiệu năng GPU hoặc frame-time trên thiết bị vật lý.
- 8 lần axe trên Guide có 0 violations nhưng đều còn `color-contrast` trong incomplete. Không coi đó là chứng nhận toàn bộ WCAG A/AA.
- Runtime: Chromium 153.0.8010.12 / Linux, Node v22.23.2. Desktop 1280×720; mobile Pixel 7 giả lập 412×839 CSS pixels.
- Chạy lúc 21:43:55–21:53:20 UTC ngày 24/09/2026, tức 04:43:55–04:53:20 ngày 25/09/2026 tại Việt Nam.

ZIP artifact ID 10835389143 đã được tải và đối chiếu digest `bb6634b05a9145d12fbb39b73ba3b71cde80b59192622e5c19472f8d5faf92a4` trước khi giải nén/đọc kết quả.

## Kiểm tra hình ảnh

14 ảnh chụp không mask viewport đã được xem trên contact sheet; các ảnh Normal/Ghost/X-ray desktop, Guide desktop-VI sáng và Guide mobile-EN tối được xem thêm ở kích thước đầy đủ. Không thấy hộp dây cam quanh mô hình trong Normal; Ghost/X-ray khác nhau đúng trạng thái đã chọn. Camera đang focus cụm thân giữa theo deep-link, không phải góc toàn cảnh.

Viền vàng quanh panel Guide trong ảnh desktop là focus ring sau kiểm bàn phím Tab, không phải Box3Helper trong cảnh 3D. Giữ phản hồi focus này.

## Phạm vi và gate còn lại

EXECUTION PASS cho bộ nghiệm thu trình duyệt trực tiếp trên GitHub Pages. Không khởi chạy localhost, không mock tài nguyên, không tiêm selection state hoặc dò nhiều tọa độ click cho đến khi đạt.

NOT YET VERIFIED: thiết bị vật lý Android/iOS/desktop của người dùng, pinch thực tế, GPU/driver/frame-time và công nghệ hỗ trợ. Playwright device emulation không thay thế thiết bị vật lý; axe cần bổ sung đánh giá thủ công.

`main` được kiểm tra lại và vẫn ở mốc ứng dụng trên. Không thay app/source, dependency, asset hoặc golden snapshots; không deploy, merge hoặc tạo release. Nhánh QA này chỉ chứa harness và bằng chứng nghiệm thu.

Bước tiếp theo là điền phiếu nghiệm thu thiết bị vật lý (19 tiêu chí) và gửi JSON kèm ảnh/video trước khi chốt release ổn định. Kết quả phiếu phải là manual self-report, không tự nhận đã có xác minh độc lập.

Nguồn phương pháp:
- https://playwright.dev/docs/emulation
- https://playwright.dev/docs/accessibility-testing
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
