import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localApi } from './local-api.ts'

export default defineConfig({
  root: fileURLToPath(new URL('../', import.meta.url)),
  build: { outDir: '.artifacts/dist' },
  plugins: [react(), localApi()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
})
