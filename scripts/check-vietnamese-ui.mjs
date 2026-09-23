import fs from 'node:fs'

const required = [
  ['public/index.html', ['lang="vi"', 'Các cụm giáo dục', 'TRÌNH BÀY CÓ HƯỚNG DẪN', 'Mặt cắt: Tắt', 'Đặt lại góc nhìn']],
  ['public/timeline-controller.mjs', ['Trạng thái lắp ghép ban đầu', 'Hướng: Tháo rời', 'Chuyển động: giảm']],
  ['public/section-controller.mjs', ['Mặt cắt đang tắt', 'Nắp trực quan: Bật']],
  ['src/assemblyManifest.ts', ['Cụm đáy', 'Cụm thân dưới', 'Cụm thân giữa', 'Cụm thân trên', 'Cụm mũi / phía tàu vũ trụ']],
]
let failed = false
for (const [file, phrases] of required) {
  const text = fs.readFileSync(file, 'utf8')
  for (const phrase of phrases) {
    if (!text.includes(phrase)) {
      console.error(`${file}: thiếu chuỗi UI tiếng Việt: ${phrase}`)
      failed = true
    }
  }
}
if (failed) process.exit(1)
console.log('Kiểm tra giao diện tiếng Việt: PASS')
