import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'
import config from './playwright.config'

export default defineConfig({
  ...config,
  webServer: {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
})
