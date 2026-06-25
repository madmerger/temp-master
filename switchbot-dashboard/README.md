# Temp Master Dashboard

SwitchBot Meter デバイスの温度・湿度をリアルタイム監視するフルスタック Web ダッシュボード。

## 技術スタック

| レイヤー       | 技術                                      |
| -------------- | ----------------------------------------- |
| フロントエンド | React 19 + TypeScript + Vite + Recharts + Tailwind CSS |
| バックエンド   | Python 3.12 + FastAPI 0.127.0 + aiosqlite (SQLite) |
| デプロイ       | Docker (マルチステージ) → Fly.io (region: nrt) |

## 機能

- 全 SwitchBot Meter デバイスの温度チャート (Recharts)
- 時間スケール切替 (hour / day / week / month / year)
- フロントエンド 30 秒自動リフレッシュ、バックエンド 120 秒間隔データ収集
- レート制限の指数バックオフ保護
- SQLite への永続化 + バックアップダウンロード

## セットアップ

### バックエンド

```bash
cd switchbot-backend
poetry install
cp .env.example .env   # SWITCHBOT_TOKEN / SWITCHBOT_SECRET を設定
poetry run fastapi dev app/main.py
```

### フロントエンド

```bash
cd switchbot-frontend
npm install
npm run dev            # localhost:5173 → バックエンド (localhost:8000) へプロキシ
```

### 本番ビルド (Docker)

```bash
cd switchbot-dashboard
docker build -t temp-master .
docker run -p 8000:8000 temp-master
```

マルチステージ Dockerfile:
1. Node イメージで Vite フロントをビルド (`dist/`)
2. Python イメージにバックエンド + `dist/` をコピーし FastAPI が静的配信

## API エンドポイント

| メソッド | パス                               | 説明                   |
| -------- | ---------------------------------- | ---------------------- |
| GET      | `/api/meters`                      | メーター一覧 (キャッシュ) |
| GET      | `/api/meters/{device_id}/history`  | 温度履歴 (`time_scale` パラメータ) |
| POST     | `/api/meters/refresh`              | 即時データ収集トリガー |
| GET      | `/api/status`                      | バックエンド状態       |
| GET      | `/api/backup`                      | SQLite DB ダウンロード |

## バックエンド構成

```
app/
├── main.py          # FastAPI アプリ初期化・ライフサイクル・静的配信
├── config.py        # 環境変数・定数
├── models.py        # Pydantic モデル・DataStore
├── api/
│   └── routes.py    # API ルーター
├── db/
│   └── database.py  # SQLite アクセス層
└── services/
    ├── switchbot.py  # SwitchBot API 連携・データ収集
    └── collector.py  # バックグラウンド収集ループ
```

## 備考

- SwitchBot API クレデンシャルは `.env` に設定 (`.env.example` を参照)
- SQLite データは Fly.io の `/data` ボリュームに永続化
- メモリ 256 MB でビルド済み静的配信が動作
