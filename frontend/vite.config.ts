import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/features': path.resolve(__dirname, 'src/features'),
      '@/app': path.resolve(__dirname, 'src/app'),
    },
    conditions: ['edge', 'browser', 'module', 'import', 'default'],
  },
  server: {
    proxy: (() => {
      const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000';
      const targets = ['/api', '/gym', '/admin', '/static', '/media'];
      return Object.fromEntries(targets.map((p) => [p, backendUrl]));
    })(),
  },
})
