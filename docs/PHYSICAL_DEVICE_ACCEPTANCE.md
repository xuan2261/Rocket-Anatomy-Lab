# Nghiệm thu thiết bị vật lý, GPU và assistive technology

Status: **NOT YET VERIFIED**

CI cross-browser/device preflight hiện tự động chạy Firefox desktop, WebKit trên macOS,
Pixel 7/Chromium emulation và iPhone 13/WebKit emulation trên đúng release candidate.
Các lane này tăng khả năng bắt regression engine/touch/responsive nhưng **không phải**
bằng chứng Android/iOS/Safari/GPU hoặc assistive technology trên thiết bị vật lý.

Tài liệu này là gate bằng chứng cho phần mà Chromium emulation/CI không thể chứng minh.
Không nâng trạng thái lên `EXECUTION PASS` chỉ vì Playwright, axe hoặc workflow
production browser acceptance đã xanh.

## Điều kiện đầu vào

- Kiểm đúng revision đã deploy; ghi đủ commit SHA 40 ký tự và URL live.
- Dùng trang production, không dùng build local khác revision.
- Không chấp nhận screenshot/video từ revision khác làm bằng chứng thay thế.
- Ghi model thiết bị, phiên bản OS, browser và thời điểm chạy. Nếu browser không cho
  xem GPU renderer thì ghi `not exposed`, không suy đoán.

## Ma trận tối thiểu

| Lane | Thiết bị thật | Browser / AT | Các thao tác bắt buộc | PASS khi |
| --- | --- | --- | --- | --- |
| Android current | Android phone | Chrome + TalkBack | portrait → landscape → portrait; chọn part; one-finger orbit; pinch zoom; đổi Normal/Ghost/X-ray; bật/tắt section | Không blank/crash, state không tự mất, control còn thao tác được, TalkBack đọc được tên/role/state chính |
| Android constrained GPU | Android phone có GPU/driver khác lane trên | Chrome | cùng chuỗi tương tác; background/foreground browser một lần rồi tiếp tục | Canvas phục hồi, không kẹt input, không có lỗi hiển thị kéo dài sau resume |
| iPhone | iPhone | Safari + VoiceOver | portrait → landscape → portrait; chọn part; one-finger orbit; pinch zoom; đổi mode; mở Help | Không blank/crash, state giữ đúng, VoiceOver đi tới được control chính và đọc nhãn có nghĩa |
| iPad / large touch | iPad nếu có | Safari + VoiceOver | landscape/portrait; pinch; panel tabs; keyboard ngoài nếu có | Layout không overflow toàn trang, target không chồng nhau, 3D interaction tiếp tục hoạt động |

Không yêu cầu cùng model thiết bị mãi mãi. Mục tiêu là có ít nhất hai họ GPU/driver
khác nhau trên Android và một WebKit/iOS lane; ghi chính xác thiết bị đã dùng.

## Checklist cho mỗi lane

1. Mở URL live và xác nhận model 3D tải hoàn tất.
2. Chọn `center-body-assembly`; tải lại trang và xác nhận deep-link/state vẫn đúng.
3. Xoay thiết bị portrait/landscape rồi quay lại; xác nhận không xuất hiện scroll toàn trang
   ngoài ý muốn và Control Center vẫn sử dụng được.
4. Thử one-finger orbit và pinch zoom trực tiếp trên màn hình cảm ứng; xác nhận camera thay đổi
   và không kích hoạt nhầm chọn part liên tục.
5. Chuyển `Normal → Ghost → X-ray → Normal`, explode rồi reset; xác nhận canvas không đen/trắng.
6. Đưa browser background rồi foreground một lần; tiếp tục tương tác để bắt lỗi context/GPU thực tế.
7. Với TalkBack hoặc VoiceOver: đi qua skip link, tab Control Center, nút mode, slider và Help;
   ghi control nào thiếu tên/role/state hoặc thứ tự focus khó dùng.
8. Chụp ít nhất một screenshot sau orientation và một screen recording ngắn có pinch + đổi mode.
   Nếu có lỗi, giữ thêm console/remote-debug log khi có thể.

## Mẫu bằng chứng

```text
Revision:
Live URL:
Date/time:
Device model:
OS version:
Browser + version:
GPU/renderer (if exposed):
Assistive technology:
Portrait/landscape: PASS|FAIL
Touch/orbit: PASS|FAIL
Pinch: PASS|FAIL
Mode/explode/section: PASS|FAIL
Background/foreground recovery: PASS|FAIL
Screen reader navigation: PASS|FAIL
Overflow/layout: PASS|FAIL
Screenshot/video artifact:
Notes:
Overall: PASS|FAIL
```

## Quy tắc trạng thái

- **EXECUTION PASS** cho một lane chỉ khi có đủ metadata và bằng chứng nêu trên.
- **FAIL** nếu có crash, canvas không phục hồi, interaction bị kẹt hoặc AT không thể thao tác
  control cốt lõi.
- **NOT YET VERIFIED** nếu chưa chạy thiết bị thật hoặc bằng chứng không gắn được với revision.
- Browser emulation, synthetic pinch và `WEBGL_lose_context` là preflight hữu ích nhưng không
  thay thế các lane vật lý này.
