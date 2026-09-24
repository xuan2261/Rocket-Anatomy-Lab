import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

for (const language of ['vi', 'en']) {
  test(`WCAG A/AA — ${language} @a11y`, async ({ page }) => {
    await page.goto(`/?lang=${language}&lesson=center-body-assembly`)
    await waitForRealAsset(page)
    await expect(page.locator('html')).toHaveAttribute('lang', language)

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_AA_TAGS)
      .analyze()

    expect(
      results.violations,
      results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.map(node => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      })),
    ).toEqual([])
  })
}
