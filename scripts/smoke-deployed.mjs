const target = process.env.SMOKE_URL

if (!target) {
  console.error('SMOKE_URL is required')
  process.exit(2)
}

const url = new URL(target)
const expectedTitle = 'Rocket Anatomy Lab - Xuan Bui Thanh - Khoa KTCS - HVHQ'

async function fetchText(resource) {
  const response = await fetch(resource, { redirect: 'follow' })
  if (!response.ok) throw new Error(`${resource} returned HTTP ${response.status}`)
  return { response, text: await response.text() }
}

try {
  const { response, text } = await fetchText(url)
  const finalUrl = new URL(response.url)
  const required = [
    `<title>${expectedTitle}</title>`,
    'id="viewport"',
    'data-language="vi"',
    'data-language="en"',
    'id="learningToggleBtn"',
  ]
  for (const needle of required) {
    if (!text.includes(needle)) throw new Error(`deployed index is missing: ${needle}`)
  }

  const moduleUrl = new URL('./bootstrap.mjs', finalUrl)
  const moduleResponse = await fetch(moduleUrl, { redirect: 'follow' })
  if (!moduleResponse.ok) throw new Error(`${moduleUrl} returned HTTP ${moduleResponse.status}`)

  console.log(`Deployed smoke PASS: ${finalUrl}`)
} catch (error) {
  console.error(`Deployed smoke FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
