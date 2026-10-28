import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: { sourcemap: true },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.js'] },
})

