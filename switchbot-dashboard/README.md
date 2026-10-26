# Temp Master Dashboard

SwitchBot Meter デバイスの温度・湿度・バッテリー情報を監視するダッシュボードです。

## 主な機能

- Chart.js 4 による温度履歴グラフ
- 時間範囲の切り替え（1時間、24時間、7日、30日、1年）
- 30秒ごとの自動更新と手動更新
- 1週間以上更新されていないメーターの stale 表示
- システム設定に連動するライト／ダークモード
- データベースバックアップのダウンロード
- API レート制限の状態表示

## セットアップ

### バックエンド

1. バックエンドのディレクトリに移動して依存関係をインストールします。

   ```bash
   cd switchbot-dashboard/switchbot-backend
   poetry install
   ```

2. 環境設定ファイルを作成し、SwitchBot の認証情報を設定します。

   ```bash
   cp .env.example .env
   ```

   SwitchBot アプリの「プロフィール > 設定 > アプリバージョン」を10回タップして開発者向けオプションを有効にし、「開発者向けオプション > トークンを取得」から認証情報を取得してください。

3. 開発サーバーを起動します。

   ```bash
   poetry run fastapi dev app/main.py
   ```

### フロントエンド

Node.js 22 が必要です。

1. フロントエンドのディレクトリに移動して依存関係をインストールします。

   ```bash
   cd switchbot-dashboard/switchbot-frontend
   npm install
   ```

2. 環境設定ファイルを作成します。

   ```bash
   cp .env.example .env
   ```

   `VITE_API_URL` が空の場合、API は同一オリジンに送信されます。開発時は Vite の `/api` プロキシが `http://localhost:8000` に転送します。プロキシ先は `VITE_PROXY_TARGET` で変更できます。バックエンドを別の場所で実行する場合は、`.env` に `VITE_API_URL` を設定してください。

3. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

   ブラウザーで http://localhost:5173 を開きます。

### フロントエンドのスクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | Vite 開発サーバーを起動 |
| `npm run build` | TypeScript を検査して本番用ビルドを作成 |
| `npm run preview` | 本番用ビルドをローカルでプレビュー |
| `npm run typecheck` | TypeScript の型を検査 |
| `npm run lint` | ESLint を実行 |
| `npm test` | Vitest のユニットテストを実行 |

## Docker

リポジトリのルートではなく `switchbot-dashboard` をビルドコンテキストにして、フロントエンドとバックエンドを含むイメージを作成します。

```bash
docker build -t temp-master switchbot-dashboard
```

ビルド時にフロントエンドの API 接続先を指定できます。

```bash
docker build \
  --build-arg VITE_API_URL=https://snakeroom.fly.dev \
  -t temp-master switchbot-dashboard
```

コンテナのポート `8000` で FastAPI がフロントエンドと API を配信します。

## API エンドポイント

- `GET /api/meters` — メーター一覧と現在値
- `GET /api/meters/{device_id}/history?time_scale={hour|day|week|month|year}` — メーターの温度履歴
- `POST /api/meters/refresh` — データ収集を手動で開始
- `GET /api/status` — バックエンド設定、レート制限、収集状態
- `GET /api/backup` — SQLite データベースのバックアップをダウンロード

## ディレクトリ構成

```text
switchbot-dashboard/
├── switchbot-backend/       # FastAPI、SQLite、データ収集
├── switchbot-frontend/
│   ├── src/
│   │   ├── components/     # ダッシュボード UI と温度グラフ
│   │   ├── hooks/           # ダッシュボード状態とテーマ
│   │   ├── api.ts           # バックエンド API クライアント
│   │   ├── config.ts        # API 接続先と更新間隔
│   │   ├── displayNames.ts  # デバイス表示名
│   │   ├── types.ts         # API・デバイス型
│   │   └── utils.ts         # 日時・stale 判定・バックアップ名
│   ├── index.html
│   └── vite.config.ts
├── .dockerignore
└── Dockerfile               # フロントエンド／バックエンドのマルチステージビルド
```
