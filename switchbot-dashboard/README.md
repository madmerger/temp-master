# Temp Master Dashboard

React 19／TypeScript／Tailwind CSS v4／Recharts／TanStack QueryとFastAPI／SQLiteによる環境監視画面です。
履歴はSQLiteへ永続化します。画面は30秒間隔でポーリングし、バックエンドは3600秒間隔で収集します。

## ローカル起動

Python 3.12、Poetry 1.8.5、Node 22を使用します。秘密情報はファイルに保存せず環境変数で渡してください。

```bash
cd switchbot-dashboard/switchbot-backend
poetry install --no-root
mkdir -p "$HOME/work/temp-master/backups"
export DB_PATH="$HOME/work/temp-master/app.db"
export BACKUP_DIR="$HOME/work/temp-master/backups"
export ADMIN_API_TOKEN=test
# 実機収集時のみSWITCHBOT_TOKENとSWITCHBOT_SECRETも安全に設定
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

別ターミナルで起動します。

```bash
cd switchbot-dashboard/frontend
npm ci
npm run dev
```

http://localhost:5173 を開きます。Viteは `/api` を `http://localhost:8000` へプロキシします。
`VITE_API_URL` は既定で空（同一オリジン）。別APIを指定する場合はバックエンドのCORS／CSPも許可します。
管理トークンはビルド変数に含めません。画面のパスワード入力で指定し、React state（メモリ）のみで保持します。ブラウザストレージには保存せず、再読み込み時は再入力が必要です。
Backupは外部API設定に関係なく、画面配信元の同一オリジン `/api/backup` からDBを取得します。Refreshやメーター取得は `VITE_API_URL` に従います。

### バックアップスクリプト

`backup_database.sh` も `ADMIN_API_TOKEN` が必須です。未設定・認証失敗・HTTPエラー・通信失敗時は終了コード1になり、失敗したダウンロードは残しません。
ループモード（`--loop`）では各失敗を表示して次の試行を継続します。
接続先はHTTPS必須です。ローカル検証に限り `http://localhost`、`http://127.0.0.1`、`http://[::1]`（ポート指定可）を許可します。Bearerヘッダーはcurlの引数ではなく標準入力へ渡します。

```bash
ADMIN_API_TOKEN=test SWITCHBOT_BACKEND_URL=http://localhost:8000 \
  BACKUP_DIR="$HOME/switchbot_backups" bash switchbot-dashboard/backup_database.sh
```

本番トークンはシェル履歴に直接記述せず、秘密情報管理から環境変数へ設定してください。

## テストデータ登録

起動中の開発バックエンドへ、正常2台と10日前のstale1台を登録します。本番DBには実行しないでください。

```bash
cd switchbot-dashboard/switchbot-backend
ADMIN_API_TOKEN=test poetry run python - <<'PY'
import os
from datetime import datetime, timedelta, timezone
import httpx

now = datetime.now(timezone.utc)
devices = []
for i, name in enumerate(["Bedroom Meter", "Living Meter", "外"]):
    updated = now - timedelta(days=10) if i == 2 else now
    devices.append({
        "device_id": f"demo-{i}", "device_name": name, "device_type": "Meter",
        "current_temperature": 23 + i, "current_humidity": 50, "battery": 90,
        "last_updated": updated.isoformat(),
        "readings": [{"timestamp": (updated - timedelta(hours=j)).isoformat(),
                      "temperature": 23 + i + j / 10, "humidity": 50}
                     for j in reversed(range(24))],
    })
response = httpx.post("http://localhost:8000/api/import",
    headers={"Authorization": f"Bearer {os.environ['ADMIN_API_TOKEN']}"},
    json={"devices": devices})
response.raise_for_status()
print(response.json())
PY
```

## 手動検証

- タイトル・ナビバーは「Temp Master Dashboard」、フッターは「Temp Master Dashboard v2.0 - Built with React + Tailwind CSS」。UIに旧ブランド名がないこと。
- 正常カードの表示名・温度・湿度・バッテリー・チャートと時間範囲5選択肢を確認。
- 「未更新のメーター」「1週間以上更新されていないデバイス」にstaleが分離され、「7日以上未更新」「履歴データの取得対象外」が表示されること。
- 管理トークンにtestを入力してDownload Backupを押しSQLiteの保存を確認。`BACKUP_DIR` は先にmkdirする。
- Refresh Data成功検証には実機のSwitchBot認証情報が必要。実行中は無効化＋Refreshing...、成功後は再取得されること。
- 実機未設定時のRefreshは500となる。操作エラーが後続ポーリングで消えないこと。
- 誤トークンは401と「管理トークンが無効です」、サーバートークン未設定は503。
- APIドキュメントは http://localhost:8000/docs 。管理操作にはBearer認証が必要。

## 自動テスト

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -q
# 140 passed（httpx非推奨警告1件）
cd ../frontend
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
# 3ファイル・15テスト
npm run build
```

`dist/`、`node_modules/`、`.venv/`、実シークレットはコミットしません。
npm 10でlock生成がクラッシュしたら `npx npm@11 install` で生成し、通常は `npm ci` で再現します。

## Docker／Fly運用

以下のbuildコマンドはリポジトリルートから実行します。

```bash
docker build -t temp-master-test switchbot-dashboard
docker volume create temp-master-data
docker run -d --name temp-master-test -p 8080:8000 \
  -e ADMIN_API_TOKEN=test -v temp-master-data:/data temp-master-test
curl -f http://localhost:8080/api/status
docker exec temp-master-test id
```

NodeステージでビルドしたdistだけをPythonステージへコピーします。`ARG VITE_API_URL` の既定は空です。
実行ユーザーは **UID/GID 10001:10001**、DBは `/data/app.db`、バックアップは `/data/backups`。
新規Docker名前付きボリュームにはイメージ内の所有権・backupsディレクトリが引き継がれます。

**Flyの既存ボリュームはroot所有でマウントされるため、イメージ内chownでは解決しません。**
常駐プロセスを非rootに保つため、自動rootエントリポイントを設けず、管理者がデプロイ前に一度だけ専用ボリュームを準備します。
旧マシンの稼働中、または保守用マシンへ当該ボリュームをマウントし、rootの保守シェルで実行してください。

```bash
fly ssh console -a <アプリ名> -u root
# 接続先で実行。/dataが当該アプリ専用ボリュームであることを確認
mkdir -p /data/backups
chown -R 10001:10001 /data
```

既存DBは事前にバックアップし、複数ボリュームなら各ボリュームで実施します。新規Flyボリュームも同様です。
未準備の場合SQLite書き込みが失敗して起動できません。rootでの常用や777への変更は避けてください。
環境変数・監査結果は [セキュリティ監査](docs/security-audit.md) を参照。
`deploy.yml` は既存の `flyctl deploy --remote-only` がDockerfileを使用するため変更不要です。`fly.toml` は変更していません。
