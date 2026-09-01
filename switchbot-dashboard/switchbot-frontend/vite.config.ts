import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 開発時は同一オリジンの /api をローカルバックエンドへ転送する
    proxy: {
      '/api': {
        target: 'https://snakeroom.fly.dev',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
