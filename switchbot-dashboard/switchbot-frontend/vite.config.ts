import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { loadEnv, searchForWorkspaceRoot } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    process.env.VITE_DEV_PROXY_TARGET ||
    env.VITE_DEV_PROXY_TARGET ||
    'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      fs: {
        allow: [
          searchForWorkspaceRoot(process.cwd()),
          resolve(process.cwd(), '../display_names.json'),
        ],
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
      clearMocks: true,
      exclude: [...configDefaults.exclude, 'e2e/**'],
    },
  }
})
