import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

const loopbackAddresses = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
const dashboardReads = /^\/api\/(?:meters(?:\/[^/\\]+\/history)?|status|backup)$/

export default defineConfig(({ mode }) => {
  const { API_PROXY_TARGET: target } = loadEnv(mode, process.cwd(), 'API_')
  const proxy: Record<string, ProxyOptions> = target ? {
    '^/api(?:/|$)': {
      target,
      changeOrigin: true,
      bypass(req) {
        const path = req.url?.split('?', 1)[0] ?? ''
        const allowed = (req.method === 'GET' && dashboardReads.test(path))
          || (req.method === 'POST' && path === '/api/meters/refresh')
        if (!loopbackAddresses.has(req.socket.remoteAddress ?? '') || !allowed) return false
      },
    },
  } : {}

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
  }
})
