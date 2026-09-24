import fs from 'node:fs'

const checks = [
  ['public/index.html', [
    'lang="vi"',
    'data-language="vi"',
    'data-language="en"',
    'Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ',
    'data-i18n="structure.title"',
    'data-i18n="timeline.kicker"',
    'data-i18n="section.kicker"',
    'data-i18n="learning.toggle"',
    'id="annotationLayer"',
  ]],
  ['public/i18n.mjs', [
    "'structure.title': 'Các cụm giáo dục'",
    "'structure.title': 'Educational assemblies'",
    "'timeline.kicker': 'TRÌNH BÀY CÓ HƯỚNG DẪN'",
    "'timeline.kicker': 'GUIDED PRESENTATION'",
    "'section.toggleOff': 'Mặt cắt: Tắt'",
    "'section.toggleOff': 'Section: Off'",
    "'learning.toggle': 'BÀI HỌC CÓ HƯỚNG DẪN'",
    "'learning.toggle': 'GUIDED LEARNING'",
    "'learning.lesson.base.title': 'Bài 1 · Cụm đáy'",
    "'learning.lesson.base.title': 'Lesson 1 · Base assembly'",
    "document.documentElement.lang = next",
    "localStorage.setItem(STORAGE_KEY, next)",
  ]],
  ['public/timeline-controller.mjs', ["onLanguageChange", "t('timeline." ]],
  ['public/section-controller.mjs', ["onLanguageChange", "t('section." ]],
  ['public/learning-controller.mjs', ["onLanguageChange", "t('learning.", "learningSearch" ]],
  ['public/real-app.mjs', ['entityLabel', 'entityDescription', 'onLanguageChange']],
  ['public/fallback-app.mjs', ['entityLabel', 'entityDescription', 'onLanguageChange']],
]

let failed = false
for (const [file, phrases] of checks) {
  const text = fs.readFileSync(file, 'utf8')
  for (const phrase of phrases) {
    if (!text.includes(phrase)) {
      console.error(`${file}: thiếu contract song ngữ: ${phrase}`)
      failed = true
    }
  }
}

if (failed) process.exit(1)
console.log('Kiểm tra giao diện song ngữ VI/EN: PASS')
