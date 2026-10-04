import { defineConfig } from '@playwright/test'
import config from './playwright.config'

export default defineConfig({
  ...config,
  testDir: './client',
  timeout: 60000,
  outputDir: '../.artifacts/client-test-results',
  use: { ...config.use, baseURL: 'http://127.0.0.1:4175' },
  webServer: { ...config.webServer, command: 'npm run preview -- --port 4175', url: 'http://127.0.0.1:4175', reuseExistingServer: false },
})
