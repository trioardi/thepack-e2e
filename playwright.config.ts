import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the DayBook E2E suite.
 *
 * The suite drives the real React UI at FRONTEND_URL, which in turn talks to
 * the Express API at BACKEND_URL. Both must be running before `npm run test:e2e`
 * (see README "Running the tests"). We intentionally do NOT use a webServer here
 * because the app needs a MongoDB instance that is provisioned outside this repo.
 */
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },

  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // The app sets Secure/SameSite=None cookies; localhost is treated as a
    // secure context by Chromium so the auth cookie is stored correctly.
    locale: 'en-US',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
