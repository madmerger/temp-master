/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API サーバーのベース URL（未設定なら同一オリジン）
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
