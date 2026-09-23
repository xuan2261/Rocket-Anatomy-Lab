import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

function installDomStubs() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
  }
  globalThis.document = {
    documentElement: { lang: 'vi' },
    title: '',
    querySelectorAll: () => [],
    querySelector: () => null,
  }
  return store
}

test('bilingual module switches html language and persists the user choice', async () => {
  const store = installDomStubs()
  const i18n = await import(`../public/i18n.mjs?test=${Date.now()}`)
  assert.equal(i18n.getLanguage(), 'vi')
  assert.equal(i18n.t('structure.title'), 'Các cụm giáo dục')

  i18n.setLanguage('en')
  assert.equal(document.documentElement.lang, 'en')
  assert.equal(store.get('rocket-anatomy-lab.language'), 'en')
  assert.equal(i18n.t('structure.title'), 'Educational assemblies')
  assert.equal(i18n.entityLabel('base-assembly'), 'Base assembly')

  i18n.setLanguage('vi')
  assert.equal(document.documentElement.lang, 'vi')
  assert.equal(i18n.entityLabel('base-assembly'), 'Cụm đáy')
})

test('UI declares requested title and both language controls', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')
  const css = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8')
  assert.match(html, /Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ/)
  assert.match(html, /data-language="vi"/)
  assert.match(html, /data-language="en"/)
  assert.match(css, /\.language-switcher button \{[^}]*min-width: 44px;[^}]*min-height: 44px;/s)
})

test('dynamic renderer/controller layers subscribe to language changes', () => {
  for (const file of ['real-app.mjs', 'fallback-app.mjs', 'timeline-controller.mjs', 'section-controller.mjs']) {
    const code = fs.readFileSync(new URL(`../public/${file}`, import.meta.url), 'utf8')
    assert.match(code, /onLanguageChange/)
  }
})
