import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const PANELS = ['objects', 'view', 'timeline', 'learning', 'section']

async function waitForRealAsset(page) {
  await expect(page.locator('#assetStatus')).toHaveAttribute('data-state', 'assembly', { timeout: 30_000 })
}

for (const language of ['vi', 'en']) {
  test(`WCAG A/AA — ${language} across Control Center tabs @a11y`, async ({ page }) => {
    await page.goto(`/?lang=${language}&lesson=center-body-assembly`)
    await waitForRealAsset(page)
    await expect(page.locator('html')).toHaveAttribute('lang', language)

    for (const panel of PANELS) {
      await page.locator(`[data-control-tab="${panel}"]`).click()
      await expect(page.locator(`[data-control-pane="${panel}"]`)).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_AA_TAGS)
        .analyze()

      expect(
        results.violations,
        `${language}/${panel}: ${results.violations.map(v => v.id).join(', ')}`,
      ).toEqual([])

      if (panel === 'objects') {
        await page.locator('[data-structure-mode="anatomy"]').click()
        await expect(page.locator('#anatomyPanel')).toBeVisible()
        const anatomyResults = await new AxeBuilder({ page })
          .withTags(WCAG_AA_TAGS)
          .analyze()
        expect(
          anatomyResults.violations,
          `${language}/anatomy: ${anatomyResults.violations.map(v => v.id).join(', ')}`,
        ).toEqual([])

        await page.locator('[data-anatomy-id="apollo-spacecraft"]').click()
        await page.locator('[data-anatomy-id="apollo-lm-sla"]').click()
        await expect(page.locator('#anatomyRealDetailCard')).toBeVisible()
        const realDetailCardResults = await new AxeBuilder({ page })
          .withTags(WCAG_AA_TAGS)
          .analyze()
        expect(
          realDetailCardResults.violations,
          `${language}/anatomy-real-detail: ${realDetailCardResults.violations.map(v => v.id).join(', ')}`,
        ).toEqual([])

        await page.locator('[data-structure-mode="model"]').click()
      }
    }
  })
}
