import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: fileURLToPath(new URL('../src/component-library/', import.meta.url)),
  plugins: [react()],
  build: {
    outDir: '../../.artifacts/components',
    emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL('../src/component-library/test-components.html', import.meta.url)) },
  },
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
})
