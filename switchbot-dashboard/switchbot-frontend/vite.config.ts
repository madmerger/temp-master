import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build output goes to `dist/`, which the backend Dockerfile copies into
// `switchbot-backend/static/` and FastAPI serves at `/`.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
