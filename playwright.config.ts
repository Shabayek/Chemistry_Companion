import { defineConfig, devices } from '@playwright/test';

/**
 * Optional: point Playwright at an already-installed Chromium instead of the one from `npx playwright install`
 * (useful in CI/sandboxes where the Playwright CDN is unreachable):
 *   PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium npx playwright test
 */
const customChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(customChromium ? { launchOptions: { executablePath: customChromium, args: ['--no-sandbox'] } } : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
