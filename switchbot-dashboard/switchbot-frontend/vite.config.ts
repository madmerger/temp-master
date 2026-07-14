import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server proxies /api to the local backend on :8000 (override the target
// with VITE_PROXY_TARGET, e.g. a deployed backend when iterating on the UI).
// In production the app is served by FastAPI from /static, so relative
// /api calls hit the same origin. Override the API base with VITE_API_URL.
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
