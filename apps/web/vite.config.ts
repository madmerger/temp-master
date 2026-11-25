import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const { API_PROXY_TARGET: target = 'http://127.0.0.1:8000' } = loadEnv(mode, process.cwd(), 'API_')
  const proxy = { '/api': { target, changeOrigin: true } }

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
  }
})
