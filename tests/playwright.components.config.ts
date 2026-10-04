import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './components',
  outputDir: '../.artifacts/component-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: fileURLToPath(new URL('../.artifacts/component-report', import.meta.url)) }]],
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    command: 'npm run components:preview',
    url: 'http://127.0.0.1:4174/test-components.html',
    reuseExistingServer: false,
  },
})
