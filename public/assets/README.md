# Tài nguyên 3D

Các file `.glb` không được commit vào Git.

- `saturn-v.glb` được lấy từ nguồn NASA chính thức bằng `npm run fetch:source` và phải vượt qua fingerprint qualification.
- `saturn-v-education.glb` được sinh từ nguồn đã xác minh bằng pipeline `npm run qualify:real`.

`npm run verify:ci` thực hiện cả hai bước này trước khi test/deploy.
