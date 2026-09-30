import { defineConfig } from '@playwright/test'

const live = process.env.REAL_DEVICE_BASE_URL || 'https://xuan2261.github.io/Rocket-Anatomy-Lab/'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'real-device.spec.mjs',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [
    ['line'],
    ['json', { outputFile: 'real-device-results.json' }],
  ],
  use: {
    baseURL: live,
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
  },
})
