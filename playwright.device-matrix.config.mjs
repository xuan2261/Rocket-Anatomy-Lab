import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'device-matrix.spec.mjs',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report-device-matrix', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report-device-matrix', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-local.mjs',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
  projects: [
    {
      name: 'desktop-firefox',
      use: {
        ...devices['Desktop Firefox'],
        headless: false,
        launchOptions: {
          firefoxUserPrefs: {
            'webgl.force-enabled': true,
            'webgl.forbid-software': false,
          },
        },
      },
    },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'android-pixel7-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'iphone13-webkit', use: { ...devices['iPhone 13'] } },
  ],
})
