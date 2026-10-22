/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 開発時は /api をローカルの FastAPI（既定: localhost:8000）へプロキシする。
// VITE_API_URL を設定した場合、ブラウザはその URL へ直接リクエストする。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // recharts（d3 系依存を含む）単体で約 540kB になるため、警告の閾値を引き上げる
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // チャートライブラリと React を別チャンクに分け、アプリ本体の更新時もキャッシュを効かせる
        manualChunks: {
          react: ['react', 'react-dom'],
          recharts: ['recharts'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
