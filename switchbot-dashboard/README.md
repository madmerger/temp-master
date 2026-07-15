# Temp Master Dashboard

SwitchBotメーターの温度・湿度・バッテリーと温度履歴を表示する監視ダッシュボードです。

## 技術スタック

- Frontend: React 19, Vite 8, TypeScript 5.9, MUI 9, Recharts 3
- Backend: FastAPI, Python 3.12, Poetry, SQLite
- Deployment: Docker, Fly.io

## 主な機能

- 全SwitchBotメーターの現在温度・湿度・バッテリー表示
- 1時間、24時間、7日、30日、1年の温度チャート
- 7日以上更新されていないメーターの分離表示
- 30秒ごとの画面自動更新と手動データ収集
- APIレート制限状態と接続エラーの表示
- ライト・ダークテーマ切替（ブラウザ設定を初期値に使用し、選択を保存）
- SQLiteデータベースのバックアップダウンロード

## ローカル開発

### Backend

```bash
cd switchbot-backend
poetry install
cp .env.example .env
poetry run fastapi dev app/main.py
```

`.env` に `SWITCHBOT_TOKEN` と `SWITCHBOT_SECRET` を設定してください。バックエンドは
`http://localhost:8000` で起動します。

### Frontend

```bash
cd switchbot-frontend
npm install
cp .env.example .env
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

- `VITE_API_URL`: ブラウザから接続するAPIのベースURL
- `VITE_DEV_PROXY_TARGET`: `VITE_API_URL` 未指定時にViteが `/api` を転送する開発用URL

本番コンテナではフロントエンドとAPIが同一オリジンになるため、
`VITE_API_URL` を空にすると現在のオリジンを使用します。別のバックエンドを利用する場合は
Viteのビルド時に `VITE_API_URL` を設定してください。

## 検証

```bash
cd switchbot-frontend
npm run typecheck
npm run build

cd ../switchbot-backend
poetry run pytest
```

## Docker

DockerfileはNode.jsステージでViteをビルドし、`dist/` をFastAPIの `static/`
ディレクトリへコピーします。

```bash
docker build \
  --build-arg VITE_API_URL=https://snakeroom.fly.dev \
  -t temp-master .
docker run --rm -p 8000:8000 \
  -e SWITCHBOT_TOKEN \
  -e SWITCHBOT_SECRET \
  temp-master
```

同一コンテナのAPIを利用する場合、`--build-arg VITE_API_URL=...` は不要です。

## API

- `GET /api/meters`
- `GET /api/meters/{device_id}/history?time_scale=hour|day|week|month|year`
- `POST /api/meters/refresh`
- `GET /api/status`
- `GET /api/backup`

バックエンドは1時間ごとにSwitchBot APIからデータを収集し、履歴をSQLiteへ保存します。
