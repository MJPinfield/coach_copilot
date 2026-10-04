import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: fileURLToPath(new URL('../', import.meta.url)),
  build: { outDir: '.artifacts/dist' },
  plugins: [react(), VitePWA({
    registerType: 'prompt', injectRegister: 'script', manifest: false,
    workbox: { globPatterns: ['**/*.{js,css,html}'], navigateFallback: 'index.html', navigateFallbackDenylist: [/^\/api\//] },
  })],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
})
