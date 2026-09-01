# Temp Master Dashboard

SwitchBot 温湿度計の測定値を監視するフルスタック Web ダッシュボード。

## 技術スタック

- バックエンド: Python 3.12 / FastAPI / SQLite (aiosqlite) / Poetry
- フロントエンド: React 19 / TypeScript / Vite / Tailwind CSS / Chart.js v4 (react-chartjs-2)
- デプロイ: Docker (multi-stage build) + Fly.io

## 機能

- 全 SwitchBot メーターの温度推移グラフ (Chart.js v4)
- 時間スケール切替 (hour / day / week / month / year)
- ダークモード切替 (localStorage に永続化、初回は OS の `prefers-color-scheme` を尊重)
- フロントエンド 30 秒ごとの自動更新 / バックエンド 1 時間ごとのバックグラウンド収集
- 1 週間以上更新のないメーターを「未更新のメーター」セクションに分離表示
- レートリミット保護 (指数バックオフ)
- GET API はすべてキャッシュ経由で、SwitchBot API を直接呼ばない

## セットアップ

### バックエンド

1. ディレクトリへ移動:
   ```bash
   cd switchbot-backend
   ```

2. 依存関係をインストール:
   ```bash
   poetry install
   ```

3. `.env.example` を `.env` にコピーして SwitchBot の認証情報を設定:
   ```bash
   cp .env.example .env
   ```

   認証情報は SwitchBot アプリから取得する:
   - プロフィール > 設定 > アプリバージョン
   - アプリバージョンを 10 回タップして開発者向けオプションを有効化
   - 開発者向けオプション > トークンを取得

4. 開発サーバーを起動:
   ```bash
   poetry run fastapi dev app/main.py
   ```

### フロントエンド

1. ディレクトリへ移動:
   ```bash
   cd switchbot-frontend
   ```

2. 依存関係をインストール:
   ```bash
   npm install
   ```

3. `.env.example` を `.env` にコピー:
   ```bash
   cp .env.example .env
   ```

4. 開発サーバーを起動:
   ```bash
   npm run dev
   ```

5. ブラウザで http://localhost:5173 を開く

#### 環境変数

| 変数名         | 説明                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| `VITE_API_URL` | バックエンド API のベースURL。空の場合は同一オリジン（開発時は Vite のプロキシ） |

未設定時は `/api` へのリクエストが Vite の開発サーバーから `http://localhost:8000` にプロキシされる。
別のバックエンドを参照する場合は `VITE_API_URL=https://snakeroom.fly.dev` のように指定する。
本番では FastAPI がビルド済みフロントを同一オリジンで配信するため、未設定のままでよい。

#### npm スクリプト

| コマンド                | 内容                              |
| ----------------------- | --------------------------------- |
| `npm run dev`           | 開発サーバー (localhost:5173)     |
| `npm run build`         | 型チェック + 本番ビルド (`dist/`) |
| `npm run typecheck`     | 型チェックのみ                    |
| `npm run lint`          | ESLint                            |
| `npm run format`        | Prettier で整形                   |
| `npm run format:check`  | Prettier の差分チェック           |

## API Endpoints

- `GET /api/meters` - 全メーターデバイスと現在値を返す（キャッシュから）
- `GET /api/meters/{device_id}/history` - `time_scale` パラメータ付きの温度履歴を返す
- `POST /api/meters/refresh` - データ収集を即時実行
- `GET /api/status` - バックエンドの状態と設定を返す
- `GET /api/backup` - SQLite データベースファイルをダウンロード

## デプロイ

`switchbot-dashboard/Dockerfile` は multi-stage build で、

1. `node:22-slim` ステージで `npm ci && npm run build` を実行し `dist/` を生成
2. Python ステージへ `dist/` を `./static/` としてコピー

FastAPI は `static/` が存在する場合、`/` でフロントエンドを配信する。

## Notes

- 温度履歴は SQLite に永続化される（Fly.io では `/data/app.db`）
- バックエンドのデータ収集間隔: 1 時間
- フロントエンドの更新間隔: 30 秒
- SwitchBot API には厳しいレートリミットがある（約 10000 リクエスト/日）
