# Temp Master Dashboard バックエンド

Web と iOS のインストール・実行手順は [リポジトリの README](../README.md) を参照してください。

## FastAPI の起動

リポジトリルートから実行します。Python 3.12 と Poetry が必要です。

```sh
cd switchbot-dashboard/switchbot-backend
poetry install
cp .env.example .env
mkdir -p backups
poetry run fastapi dev app/main.py
```

SwitchBot からデータを収集する場合は、`.env` の `SWITCHBOT_TOKEN` と `SWITCHBOT_SECRET` にアプリの開発者オプションで発行した値を設定します。別の `DB_PATH` を使う場合は、DB と同じ親ディレクトリに `backups` を作成するか、既存のディレクトリを `BACKUP_DIR` に指定します。

## ダッシュボードが使う API

| メソッド | パス | 用途 |
| --- | --- | --- |
| GET | `/api/meters` | 現在のメーター情報 |
| GET | `/api/meters/{device_id}/history` | `time_scale` で指定した期間の履歴 |
| POST | `/api/meters/refresh` | データ収集を要求 |
| GET | `/api/status` | 接続設定、メーター件数、レート制限 |
| GET | `/api/backup` | SQLite スナップショットのダウンロード |
