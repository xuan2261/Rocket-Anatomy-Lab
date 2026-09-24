# Hướng dẫn sử dụng Rocket Anatomy Lab

Rocket Anatomy Lab là trình trực quan hóa 3D giáo dục cho mô hình Saturn V của NASA. Tài liệu này tập trung vào **cách sử dụng phần mềm**, còn chi tiết kiến trúc, kiểm thử và nguồn dữ liệu nằm trong các tài liệu kỹ thuật khác của repository.

> **Phạm vi giáo dục:** các “cụm” trong ứng dụng là vùng hình học phục vụ quan sát và học tập. Chúng không phải ranh giới tầng lịch sử và không phải hướng dẫn lắp ráp, vận hành hay chế tạo ngoài đời thực.

## Bắt đầu trong 60 giây

1. Mở ứng dụng tại <https://xuan2261.github.io/Rocket-Anatomy-Lab/>.
2. Kéo trên mô hình để xoay; lăn chuột hoặc chụm hai ngón để thu/phóng.
3. Bấm trực tiếp vào tên lửa hoặc mở **Đối tượng** và chọn một trong 5 cụm giáo dục.
4. Mở **Góc nhìn** để chuyển giữa **Bình thường**, **Bóng mờ**, **X-quang** và thử thanh **Tách cụm**.
5. Dùng **Trình bày**, **Bài học**, **Mặt cắt** hoặc **Hướng dẫn** theo mục tiêu quan sát.

## Trung tâm điều khiển

### Đối tượng

- Chọn một cụm từ cây cấu trúc hoặc trực tiếp trên mô hình.
- Ô chọn bên trái từng cụm dùng để ẩn/hiện.
- **Cô lập** chỉ giữ cụm đang chọn; **Thoát cô lập** trả lại ngữ cảnh.
- **Hiện tất cả** khôi phục mọi cụm.
- Chuyển sang **Giải phẫu NASA** để duyệt cây tham chiếu nhiều cấp, nguồn và mức bằng chứng.

### Góc nhìn

- **Bình thường**: tất cả cụm đang hiển thị giữ độ đục đầy đủ; cụm được chọn chỉ được nhấn nhẹ để giữ ngữ cảnh.
- **Bóng mờ**: cụm đang chọn nổi bật, các cụm khác được làm mờ có chủ đích.
- **X-quang**: dùng hiển thị xuyên thấu/wireframe để quan sát cấu trúc trực quan.
- **Tách cụm**: kéo từ 0–100% để tách các vùng hình học theo trục đã định nghĩa cho mô hình số.
- **Đặt lại góc nhìn** đưa camera và trạng thái xem về cấu hình chuẩn.

### Trình bày

- **Trước / Tiếp**: di chuyển theo từng bước.
- **Phát / Tạm dừng**: chạy trình tự có hướng dẫn.
- **Hướng: Tháo rời / Lắp lại**: đổi chiều trình tự.
- **Khởi động lại**: trở về trạng thái lắp ghép số ban đầu.

### Bài học

Có 5 bài học semantic tương ứng với 5 cụm giáo dục. Mỗi bài có thể:

- chọn và focus camera vào cụm tương ứng;
- bật chú thích 3D;
- áp dụng preset góc nhìn/mặt cắt phù hợp;
- sao chép deep-link, ví dụ `?lesson=center-body-assembly&lang=vi`.

Deep-link giữ nguyên bài học sau khi tải lại trang.

### Mặt cắt

- Bật/tắt mặt cắt.
- Chọn trục **X / Y / Z**.
- Di chuyển vị trí mặt phẳng cắt.
- Đảo hướng cắt.
- Bật/tắt **nắp trực quan** khi renderer thật hỗ trợ.

### Hướng dẫn

Tab **Hướng dẫn / Guide** là bản tóm tắt sử dụng ngay trong ứng dụng. Nó luôn nằm trong cùng Control Center để người dùng không phải rời khỏi màn hình 3D.

## Thao tác bàn phím và accessibility

- Khi focus ở hàng tab, dùng **← / →** để chuyển tab.
- **Home / End** chuyển đến tab đầu/cuối.
- **Tab** đi vào nội dung panel đang mở.
- Các điều khiển chính có vùng tương tác tối thiểu 44 px; thiết bị coarse-pointer tăng lên 48 px.
- Ứng dụng hỗ trợ `prefers-reduced-motion`.
- Giao diện VI/EN cập nhật `html[lang]` và các nhãn ARIA tương ứng.

## Đọc chế độ hiển thị đúng cách

| Chế độ | Mục đích | Điều không nên suy diễn |
| --- | --- | --- |
| Bình thường | Giữ đầy đủ bối cảnh 3D | Không có cụm nào bị làm trong suốt chỉ vì đang chọn cụm khác |
| Bóng mờ | Nhấn cụm hiện tại, giữ bối cảnh mờ | Không phải vật liệu/vỏ thật |
| X-quang | Quan sát xuyên thấu trực quan | Không phải ảnh chụp hay cấu trúc kỹ thuật chính xác |
| Mặt cắt | Quan sát phần geometry đang có trong GLB | Không suy ra cấu tạo chưa tồn tại trong asset nguồn |

## Giải phẫu NASA và mức bằng chứng

Chế độ **Giải phẫu NASA** tách biệt hai lớp thông tin:

- tên tầng/hệ thống/thành phần và liên kết nguồn đến từ dữ liệu NASA tham chiếu;
- marker, camera bookmark và vị trí mặt cắt trên mô hình tổng thể là neo trực quan giáo dục gần đúng.

Khi một node có asset chi tiết NASA đã được xác minh, ứng dụng có thể lazy-load gói GLB cục bộ và hiển thị provenance của part nguồn.

## Khắc phục nhanh

- Nếu badge báo **fallback**, các tính năng cần GLB thật sẽ bị vô hiệu thay vì mô phỏng sai.
- Nếu mô hình chưa xuất hiện, kiểm tra WebGL và kết nối mạng dùng để tải dependency/asset đã ghim.
- Nếu giao diện quá chật trên điện thoại, xoay ngang hoặc dùng tab trong Control Center; trang không yêu cầu cuộn toàn bộ document.
- Khi nghi ngờ trạng thái, dùng **Hiện tất cả** rồi **Đặt lại góc nhìn**.

## Xem thêm

- [README](../README.md)
- [Kiến trúc](ARCHITECTURE.md)
- [Kiểm thử](TESTING.md)
- [Semantic map](SEMANTIC_MAP.md)
- [Asset qualification](ASSET_QUALIFICATION.md)
- [Triển khai](DEPLOYMENT.md)
