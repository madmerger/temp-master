import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, requests to /api are proxied to the backend. The proxy
// target can be overridden with VITE_PROXY_TARGET (defaults to the local
// FastAPI dev server on port 8000).
const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
