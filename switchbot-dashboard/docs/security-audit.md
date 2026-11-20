# セキュリティ監査（フェーズ1）

## Fly運用・デプロイ準備（フェーズ3）

コンテナはUID/GID 10001:10001で実行し、常駐rootプロセスや起動時の自動権限昇格は採用しない。
Flyボリュームはroot所有でマウントされ、Dockerfile内のchownを隠すため、デプロイ前に管理者による一度の所有権準備が必要。
事前にDBをバックアップし、旧マシンまたは当該ボリュームをマウントした保守用マシンのrootシェルで実行する。

```bash
fly ssh console -a <アプリ名> -u root
# 接続先の/dataが当該アプリ専用ボリュームであることを確認してから実行
mkdir -p /data/backups
chown -R 10001:10001 /data
```

複数ボリュームでは各ボリュームで準備する。新規Flyボリュームも同様。未準備ならSQLiteへの書き込みが失敗し起動できない。
この方法はrootエントリポイントを増やさず、権限変更を明示的な保守操作に限定するため採用した。777に変更しないこと。
新規Docker名前付きボリュームはイメージ内の/data所有権とbackupsディレクトリを引き継ぐが、既存root所有ボリュームは同じ準備が必要。

管理トークンは十分に長いランダム値を安全に生成し、シェル履歴・ログに残さずFly secretsへ設定する。以下は書式例（値はプレースホルダー）。

```bash
fly secrets set -a <アプリ名> ADMIN_API_TOKEN='<安全に生成した管理トークン>'
```

トークンはVITE変数やフロントエンドへ埋め込まない。画面の管理トークン入力から、管理API呼び出し時のみBearerとして送る。
同一オリジン配信ではCORS_ALLOW_ORIGINSとCSP_CONNECT_SRCは未設定でよい。
別オリジンのUIからAPIへアクセスさせる場合、API側の許可元を明示する。

```bash
fly secrets set -a <アプリ名> CORS_ALLOW_ORIGINS='https://dashboard.example.com,https://admin.example.com'
```

CSP_CONNECT_SRCは、そのコンテナから配信するページが接続する追加のAPIオリジン用。CORSの許可元とは方向が逆なので混同しない。
外部APIをビルド時VITE_API_URLに指定した場合は、そのAPIオリジンをconnect-srcへ追加し、相手API側のCORSも別途設定する。

```bash
fly secrets set -a <アプリ名> CSP_CONNECT_SRC='https://api.example.com'
```

値はカンマ区切りの信頼できるオリジンのみとし、ワイルドカードや任意のCSPディレクティブを入れない。allow_credentialsは常にFalse。
DB_PATHの既定は/data/app.db、BACKUP_DIRは/data/backups。バックアップ先は起動前に作成する。
この作業でFlyへのデプロイ・secrets更新・本番ボリューム変更は行っていない。

### フェーズ3のDocker検証

CIワークフローはactionlint 1.7.7で検査し、エラーなし。
初回は以下のbuildがベースイメージ取得で失敗した。

```text
$ docker build -t temp-master-test switchbot-dashboard
python:3.12-slim: failed to resolve source metadata
429 Too Many Requests
```

代替の公開ECRからのpython／node取得も `Error response from daemon: error from registry: Data limit exceeded` で失敗。
その後、Googleミラーからpython:3.12-slim／node:22-slimを取得し、元のFROM名へtagして再試行した。
Dockerfileは変更せず、次のbuildが成功。Poetry 1.8.5で45依存の新規インストールも成功した。

```bash
docker pull mirror.gcr.io/library/python:3.12-slim
docker tag mirror.gcr.io/library/python:3.12-slim python:3.12-slim
docker pull mirror.gcr.io/library/node:22-slim
docker tag mirror.gcr.io/library/node:22-slim node:22-slim
docker build --pull=false -t temp-master-test switchbot-dashboard
```

管理トークンtest、名前付きボリュームを/dataへマウントし、同一イメージで次の2条件を検証した。

|条件|/dataと/data/backups|結果|
|---|---|---|
|準備済み|10001:10001、0755|起動成功、import／backup成功|
|未準備|0:0、0755|lifespanのinit_databaseでDB作成失敗、終了コード3、HTTP接続不可|

準備済みコンテナの実測値:

```text
uid=10001(app) gid=10001(app) groups=10001(app)
10001:10001 755 /data
10001:10001 755 /data/backups
GET / HTTP/1.1 200 OK
/assets/index-C7v4Mg-6.js 200
/assets/index-BcG71skU.css 200
GET /api/status HTTP/1.1 200 OK
POST /api/import: {"status":"ok","imported_devices":1,"imported_readings":1}
GET /api/backup HTTP/1.1 200 OK
content-type: application/x-sqlite3
content-disposition: attachment; filename="switchbot_backup_20261120_055658.db"
content-length: 36864
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
content-security-policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'
integrity_check: ok
devices: [('container-meter',)]
readings: [(23.5, 50)]
10001:10001 644 /data/app.db
```

HTMLはReactのroot要素と同一オリジンのJS/CSSを返し、HTMLにも上記セキュリティヘッダーが付くことを確認。
ダウンロードしたDBをSQLiteで開き、importした行とintegrity_checkを検証した。送信後の/data/backupsに一時スナップショットは残っていない。

root所有のままのコンテナの実測値:

```text
status=exited exit=3 user=10001:10001
File "/app/app/main.py", line 581, in lifespan
    await init_database()
File "/app/app/main.py", line 105, in init_database
    async with aiosqlite.connect(DB_PATH) as db:
sqlite3.OperationalError: unable to open database file
ERROR:    Application startup failed. Exiting.
curl: (7) Failed to connect to localhost port 8081
root-owned status: 000
```

書き込み失敗はAPI呼び出し時ではなく起動時に発生する。Fly本番ボリュームへの反映自体は未実施であり、事前所有権準備は引き続き必須。

## 修正前の記録

対象: `switchbot-backend/app/main.py`、`app/alerts.py`、`pyproject.toml`、`poetry.lock`。

|重大度|場所|内容|対応方針|
|---|---|---|---|
|高|GET `/api/backup`|認証なしでDB全体を取得可能|管理Bearer認証を必須化|
|高|POST `/api/import`|認証なしでDB書き込み可能|同じ管理認証を必須化|
|中|POST `/api/meters/refresh`|認証なしで上流API収集を起動可能|同じ管理認証を必須化|
|中|CORS設定|全オリジン許可とcredentials有効の組合せ|環境変数による明示許可、既定無効|
|中|レスポンス全般|CSP等の防御ヘッダーなし|正常・404・例外応答に付与|
|中|上流エラー処理|上流本文・例外文字列をDBとHTTP detailに保存。秘密情報が反射される可能性（実際の漏洩は未確認）|本文・例外文字列を保存しない|
|中|依存|pip-auditで11パッケージ44件（重複を含む）|修正版へ更新|
|低|psycopg|コード参照なし、SQLiteのみ使用|依存から削除|
|情報|静的配信|import時のみ登録、resolve/is_relative_toによるディレクトリ外参照防止あり|登録関数に抽出しテスト|

### 全エンドポイントの認証

修正前は全て認証なし: `/healthz`、GET `/api/meters`、GET `/api/meters/{device_id}/history`、POST `/api/meters/refresh`、GET `/api/status`、GET `/api/latency-logs`、GET `/api/latency-stats`、POST `/api/import`、GET `/api/backup`、`/docs`、`/docs/oauth2-redirect`、`/redoc`、`/openapi.json`、静的SPAのGETフォールバック。
修正後は上記3管理操作のみ認証必須とし、読み取りAPI・ドキュメント・SPAは公開のまま（要件どおり）。

### シークレット管理

`load_dotenv()`後、SwitchBot token/secretを環境変数から読み署名ヘッダーに使用。Slack token/channelは送信時に環境変数から読む。固定の秘密値は対象コードにない。リクエスト本文・Authorizationを直接ログ出力する箇所はない。
ただし上流エラー本文・例外文字列、Slackのエラー文字列、未処理例外のtracebackは外部由来の文字列を含み得るため、秘密値を反射させない形式へ制限する。実環境の過去ログ／Fly secretsの値は調査対象外。
管理トークンはFly secretsの `ADMIN_API_TOKEN` として別途設定が必要（この作業では本番変更しない）。クライアントは管理操作時のみBearerを送信し、フロントエンドビルドにトークンを埋め込まないこと。

### 修正前 pip-audit

Poetry 1.8.5の `poetry export --with dev --without-hashes` で開発依存を含むrequirementsを出力し、pip-audit 2.10.1で監査。
以下は実行結果（重複もそのまま記録）。

```text
Found 44 known vulnerabilities in 11 packages
Name              Version  ID              Fix Versions
----------------- -------- --------------- ------------
anyio             4.12.1   PYSEC-2026-4025 4.14.2
anyio             4.12.1   PYSEC-2026-4024 4.14.2
certifi           2026.1.4 PYSEC-2026-4320 2026.10.18
certifi           2026.1.4 PYSEC-2026-4320 2026.10.18
dnspython         2.8.0    CVE-2026-114605 2.9.0
dnspython         2.8.0    CVE-2026-128089 2.9.2
starlette         0.50.0   PYSEC-2026-161  1.0.1
starlette         0.50.0   PYSEC-2026-161  1.0.1
starlette         0.50.0   PYSEC-2026-2281 1.1.0
starlette         0.50.0   PYSEC-2026-2280 1.1.0
starlette         0.50.0   PYSEC-2026-249  1.3.1
starlette         0.50.0   PYSEC-2026-248  1.3.0
starlette         0.50.0   PYSEC-2026-249  1.3.1
starlette         0.50.0   PYSEC-2026-248  1.3.0
starlette         0.50.0   PYSEC-2026-2281 1.1.0
starlette         0.50.0   PYSEC-2026-2280 1.1.0
idna              3.11     PYSEC-2026-215  3.15
idna              3.11     PYSEC-2026-215  3.15
pydantic-settings 2.12.0   CVE-2026-58203  2.14.2
pygments          2.19.2   PYSEC-2026-2987 2.20.0
pygments          2.19.2   PYSEC-2026-2987 2.20.0
pytest            8.4.2    PYSEC-2026-1845 9.0.3
pytest            8.4.2    PYSEC-2026-1845 9.0.3
python-dotenv     1.2.1    PYSEC-2026-2270 1.2.2
python-dotenv     1.2.1    PYSEC-2026-2270 1.2.2
python-multipart  0.0.21   PYSEC-2026-1852 0.0.22
python-multipart  0.0.21   PYSEC-2026-3038 0.0.26
python-multipart  0.0.21   PYSEC-2026-3039 0.0.27
python-multipart  0.0.21   PYSEC-2026-3040 0.0.31
python-multipart  0.0.21   PYSEC-2026-3036 0.0.30
python-multipart  0.0.21   PYSEC-2026-3037 0.0.30
python-multipart  0.0.21   PYSEC-2026-1852 0.0.22
python-multipart  0.0.21   PYSEC-2026-3038 0.0.26
python-multipart  0.0.21   PYSEC-2026-3037 0.0.30
python-multipart  0.0.21   PYSEC-2026-3036 0.0.30
python-multipart  0.0.21   PYSEC-2026-3040 0.0.31
python-multipart  0.0.21   PYSEC-2026-3039 0.0.27
urllib3           2.6.3    PYSEC-2026-141  2.7.0
urllib3           2.6.3    PYSEC-2026-142  2.7.0
urllib3           2.6.3    PYSEC-2026-142  2.7.0
urllib3           2.6.3    PYSEC-2026-141  2.7.0
urllib3           2.6.3    PYSEC-2026-4177 2.8.0
urllib3           2.6.3    PYSEC-2026-4176 2.8.0
urllib3           2.6.3    PYSEC-2026-4175 2.8.0
```

PYSEC識別子はpip-auditが返した形式のまま掲載。CVE識別子を返した検出はdnspythonのCVE-2026-114605・CVE-2026-128089、pydantic-settingsのCVE-2026-58203。重複のある結果を独立したCVE件数として扱わない。

## 修正後の結果

同じ手順で開発依存を含めて再監査。

```text
No known vulnerabilities found
```

管理認証は `Depends(require_admin_token)` と `secrets.compare_digest` で統一。未設定は503、ヘッダーなし・不一致は401と `WWW-Authenticate: Bearer`。CORSは明示オリジンのみ、credentialsは常にFalse。`*` は許可値から除外する。
セキュリティヘッダーは既存リクエストミドルウェアが生成する500応答にも付与。ドキュメントのCSP例外は `/docs`、`/docs/oauth2-redirect`、`/redoc` のみに限定する。

### 検証

```text
$ poetry run pytest -q
140 passed, 1 warning in 2.58s
```

警告: Starlette 1.10.0のTestClientでhttpx利用が非推奨（httpx2を推奨）。テストは全件成功し、本作業では新規HTTPクライアントへの移行は行わない。
pytest前に `static` シンボリックリンクがないことを確認。認証、実DBへのimportとSQLiteスナップショットの復元内容、ヘッダー（200/404/500）、CORS、Vite型SPAとディレクトリ外参照拒否をテストした。

生成ツールは **Poetry 1.8.5**、lock-versionは **2.0**。グローバルのPoetryは2.5.1だが、lock生成と依存更新は独立venv内の1.8.5を使用した。

```text
$ /home/ubuntu/work/security-tools/bin/poetry --version
Poetry (version 1.8.5)
$ /home/ubuntu/work/security-tools/bin/poetry install --no-root --no-interaction
Installing dependencies from lock file

No dependencies to install or update
```

pipxが未導入のため独立venvにPoetry 1.8.5／exportプラグイン／pip-auditをインストールした。export時のプラグイン将来既定変更の警告は、プラグインが実際に明示導入済みであることを確認しており、環境未ロードではない。

ローカル実サーバーの `/docs` をChromeで開き、SwaggerのAPI一覧と管理操作の認証アイコンがレンダリングされることを確認（スクリーンショットは作業報告参照）。本番への反映・Fly secrets設定・管理操作を呼ぶフロントエンドの変更は未実施。

### 更新パッケージ一覧

FastAPIの旧制約では修正済みStarletteを導入できないためFastAPIを更新。開発依存pytestも脆弱性修正のため9系へ上げ、互換性のためpytest-asyncioを1系へ更新した。Poetry updateで同時に更新された推移依存も含む。`—` は追加／削除を示す。

|パッケージ|修正前|修正後|
|---|---|---|
|agent-detector|—|2.0.0|
|annotated-doc|0.0.4|0.0.7|
|annotated-types|0.7.0|0.8.0|
|anyio|4.12.1|4.16.0|
|certifi|2026.1.4|2026.10.23|
|click|8.3.1|8.5.1|
|coverage|7.13.1|7.17.3|
|detect-installer|—|0.2.1|
|dnspython|2.8.0|2.9.2|
|email-validator|2.3.0|2.4.0|
|fastapi|0.127.0|0.139.2|
|fastapi-cli|0.0.20|0.0.34|
|fastapi-cloud-cli|0.9.0|0.28.0|
|fastar|0.8.0|0.12.0|
|httptools|0.7.1|0.9.0|
|idna|3.11|3.20|
|iniconfig|2.3.0|2.3.1|
|markdown-it-py|4.0.0|4.3.0|
|markupsafe|3.0.3|3.0.4|
|packaging|25.0|26.3|
|pluggy|1.6.0|1.7.0|
|psycopg|3.3.2|—|
|psycopg-binary|3.3.2|—|
|pydantic|2.12.5|2.14.4|
|pydantic-core|2.41.5|2.50.5|
|pydantic-extra-types|2.11.0|2.11.1|
|pydantic-settings|2.12.0|2.16.3|
|pygments|2.19.2|2.21.0|
|pytest|8.4.2|9.2.0|
|pytest-asyncio|0.24.0|1.5.0|
|python-dotenv|1.2.1|1.2.4|
|python-multipart|0.0.21|0.0.34|
|rich|14.2.0|15.0.0|
|rich-toolkit|0.17.1|0.20.6|
|rignore|0.7.6|0.8.1|
|sentry-sdk|2.49.0|2.75.0|
|starlette|0.50.0|1.10.0|
|typer|0.21.1|0.29.2|
|typing-extensions|4.15.0|4.16.0|
|typing-inspection|0.4.2|0.4.5|
|tzdata|2025.3|—|
|urllib3|2.6.3|2.8.0|
|uvicorn|0.40.0|0.54.0|
|uvloop|0.22.1|0.23.0|
|watchfiles|1.1.1|1.3.0|
|websockets|16.0|17.4|
