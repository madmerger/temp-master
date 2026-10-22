# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts (React 18 + TypeScript + Vite)
- Time scale switching (hour/day/week/month/year)
- Stale meters (no update for 7+ days) are listed separately under 「未更新のメーター」
- Database backup download (`GET /api/backup`)
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached - GET endpoints never call SwitchBot API directly

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd switchbot-backend
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Copy `.env.example` to `.env` and add your SwitchBot credentials:
   ```bash
   cp .env.example .env
   ```
   
   Get your credentials from the SwitchBot app:
   - Go to Profile > Preferences > About
   - Tap App Version 10 times to enable Developer Options
   - Go to Developer Options > Get Token

4. Start the development server:
   ```bash
   poetry run fastapi dev app/main.py
   ```

### Frontend

フロントエンドは React 18 + TypeScript + Vite + Recharts で構成されています（Node.js 20 以上を推奨）。

1. フロントエンドのディレクトリへ移動します:
   ```bash
   cd switchbot-frontend
   ```

2. 依存パッケージをインストールします:
   ```bash
   npm install
   ```

3. 必要に応じて `.env.example` を `.env` にコピーし、`VITE_API_URL` を設定します:
   ```bash
   cp .env.example .env
   ```
   - `VITE_API_URL` が空（未設定）の場合、API は同一オリジンへリクエストされます。開発サーバーでは `/api` が `http://localhost:8000`（上記のバックエンド）へプロキシされます。
   - 本番と同じデータを参照する場合は `VITE_API_URL=https://snakeroom.fly.dev` を設定します。
   - プロキシ先を変更する場合は、環境変数 `VITE_PROXY_TARGET` を指定して `npm run dev` を起動します。

4. 開発サーバーを起動します:
   ```bash
   npm run dev
   ```

5. ブラウザで http://localhost:5173 を開きます

#### npm スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | Vite 開発サーバー（localhost:5173）を起動 |
| `npm run build` | 型チェック（`tsc -b`）後に `dist/` へ本番ビルド |
| `npm run preview` | ビルド成果物をローカルでプレビュー |
| `npm run typecheck` | TypeScript の型チェックのみ実行 |
| `npm run lint` | ESLint を実行 |
| `npm run format` / `npm run format:check` | Prettier で整形 / 整形チェック |
| `npm test` | Vitest でユニットテストを実行 |

### Docker / デプロイ

`Dockerfile` はマルチステージ構成です。Node ステージで `npm ci && npm run build` を実行し、生成された `dist/` を Python ステージの `./static/` にコピーします。FastAPI はこれまでどおり `./static/` を `/` で配信します。

```bash
docker build -t temp-master .
# API の接続先を変更する場合（既定: https://snakeroom.fly.dev）
docker build --build-arg VITE_API_URL=https://example.com -t temp-master .
```

`Download Backup` ボタンは `VITE_API_URL` に関係なく、ダッシュボードを配信しているオリジンの `/api/backup` を呼び出します。

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads a snapshot of the SQLite database

## Notes

- Temperature history is persisted in SQLite (`DB_PATH`, default `/data/app.db` on Fly.io)
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
