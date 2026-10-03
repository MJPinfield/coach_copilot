import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localApi } from './dev/local-api.ts'

export default defineConfig({
  plugins: [react(), localApi()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
})
