---
name: testing-temp-master
description: React版Temp Master DashboardのAPI・表示・管理操作をローカル検証する。
---

# Temp Master Dashboardの検証

## 起動とシード

Python 3.12、Poetry 1.8.5、Node 22を使用する。秘密情報をファイルへ書かない。

```bash
cd switchbot-dashboard/switchbot-backend
poetry install --no-root
mkdir -p "$HOME/work/temp-master/backups"
export DB_PATH="$HOME/work/temp-master/app.db"
export BACKUP_DIR="$HOME/work/temp-master/backups"
export ADMIN_API_TOKEN=test
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

実機収集時のみ起動前にSWITCHBOT_TOKEN／SWITCHBOT_SECRETも安全に設定する。別ターミナルで起動する。

```bash
cd switchbot-dashboard/frontend
npm ci
npm run dev
```

http://localhost:5173 を開く。`/api` はViteからlocalhost:8000へプロキシする。
旧staticシンボリックリンクは不要。pytest前に未追跡staticシンボリックリンクがあれば取り除く。
`switchbot-dashboard/README.md` の認証付き `POST /api/import` シード例で正常2台・10日前のstale1台を登録する。本番DBには実行しない。

## 手動確認

- 正常カードの表示名・温度・湿度・バッテリー・温度折れ線。時間範囲hour/day/week/month/year、既定day。
- staleの見出し「未更新のメーター」、説明「1週間以上更新されていないデバイス」、バッジ「7日以上未更新」、説明「履歴データの取得対象外」。
- last_updatedなしは「値がありません（データ未受信）」。
- 管理トークンへtestを入力。Download BackupでSQLiteファイルを保存。`BACKUP_DIR` は起動前にmkdirする。
- Refresh Data実行中はRefreshing...かつ無効。成功後に再取得。成功検証には実機認証情報が必要。
- 誤トークン401、サーバートークン未設定503。操作エラーは通常のポーリング成功で消えないこと。
- meters／status／historyは30秒間隔のポーリング。

## Branding・CSP

- タイトル・ナビバーはTemp Master Dashboard。
- フッターはTemp Master Dashboard v2.0 - Built with React + Tailwind CSS。
- UIにSnake／SnakeRoomを表示しない。ブルー基調。
- 外部CDNなし。production buildをバックエンドから配信しCSP有効下でカード・チャートを確認。
- /docsでSwaggerが描画されること。

## 自動テスト

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -q
# 140 passed、httpx非推奨警告1件
cd ../frontend
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
# 3ファイル・15テスト
npm run build
```

Dockerの非root・ボリューム所有権・Fly secretsはREADMEと `docs/security-audit.md` を参照する。
