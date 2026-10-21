# 現行画面仕様書（jQuery 版 Temp Master Dashboard）

jQuery → React 19 移行の基準となる、現行フロントエンドの仕様書です。後続のテストケース台帳・ベースライン取得・React 実装は、この文書の **仕様 ID（`UI-xx` / `API-xx` / `BEH-xx` など）** を参照してください。

- 対象ファイル: `switchbot-dashboard/switchbot-frontend/index.html`（701 行、単一 HTML。ビルド工程なし）
- 対象リビジョン: `main` @ `b580faa`（PR #72 マージ後）
- 併記するバックエンド: `switchbot-dashboard/switchbot-backend/app/main.py`（FastAPI）
- 記述方針: コードと実機確認（§14）で確かめた事実のみ書く。意図が読み取れない点・移行時に挙動を残すか決める必要がある点は **「要確認」** として §13 にまとめる。

---

## 1. 技術構成

| 項目 | 内容 |
|---|---|
| UI ライブラリ | jQuery **1.12.4**、Bootstrap **3.3.7**（CSS + JS）、Chart.js **2.9.4** |
| 読み込み | すべて cdnjs.cloudflare.com から `<link>` / `<script>` で読み込み。npm / バンドラなし |
| スクリプト | `index.html` 末尾のインライン `<script>` 1 本（ES5、`var` / コールバック、Promise は Download Backup の `fetch` のみ） |
| 配信 | `Dockerfile` が `switchbot-frontend/` を `./static/` にコピーし、FastAPI の `serve_spa`（`GET /{full_path:path}`）が `/` で `index.html` を返す。存在するファイルパスはそのファイル、それ以外は `index.html` |
| 本番 | Fly.io アプリ `temp-master`（`https://temp-master.fly.dev`）。ただしメーター系 API は別ホスト（§4.1） |
| `<html lang>` | `en`（画面内には日本語文言もある） |
| `<title>` | `Temp Master Dashboard` |

> 補足: repo の環境ブループリントのメモには「Frontend: React 18 + TypeScript + Vite」とあるが、`main` には `package.json` がなく、現行は上記の単一 HTML のみ。

---

## 2. 画面構成

上から順に次の要素が並ぶ（`container-fluid` 内）。

| ID | 要素 | DOM / クラス | 初期表示 | 内容 |
|---|---|---|---|---|
| UI-01 | ナビバー | `nav.navbar.navbar-default.navbar-fixed-top` | 表示 | ブランド「Temp Master Dashboard」（`href="#"`）、メニュー「Dashboard」（`li.active`、`href="/"`） |
| UI-02 | 接続状態ラベル | `#connection-status`（ナビバー右、`.navbar-status.pull-right`） | 表示・**緑「Connected」**（`label-success`） | 成功時「Connected」（緑）、エラー時「Disconnected」（赤 `label-danger`）。BEH-07 参照 |
| UI-03 | 操作パネル | `.panel.panel-default > .panel-body > form.form-inline` | 表示 | 以下 UI-04〜06 |
| UI-04 | 期間セレクト | `select#time-scale-select.form-control`、ラベル「Time Range:」 | `day` 選択 | 選択肢は表 2-1 |
| UI-05 | Refresh Data ボタン | `button#btn-refresh.btn.btn-primary` | 「Refresh Data」 | 押下中は disabled +「Refreshing...」 |
| UI-06 | Download Backup ボタン | `button#btn-backup.btn.btn-default` | 「Download Backup」 | 押下中は disabled +「Downloading...」 |
| UI-07 | ステータスバー | `#status-bar.alert.alert-info` | **非表示** | 左「Monitoring N meters」（`#status-meters-count`）、右「Last refresh: HH:MM:SS」（`#status-last-refresh.pull-right`） |
| UI-08 | レート制限警告 | `#rate-limit-warning.alert.alert-warning` | 非表示 | 太字「Rate Limited.」+ `#rate-limit-text` |
| UI-09 | ローディング | `#loading`（中央寄せ、上下 40px） | **表示** | `p.text-muted`「Loading temperature data...」 |
| UI-10 | エラー表示 | `#error.alert.alert-danger` | 非表示 | 太字「Error.」+ `#error-text`（既定文言「Failed to fetch data.」） |
| UI-11 | メーターコンテナ | `#meters-container` | 空 | アクティブメーターのグリッド（UI-12）＋未更新メーターセクション（UI-13） |
| UI-12 | メーターパネルのグリッド | `.row > .col-md-4.col-sm-6 > .panel.panel-default` | — | §6 |
| UI-13 | 未更新メーターセクション | `.meter-section`（見出し）+ `.panel.panel-warning.stale-meters-panel` | — | 未更新メーターが 1 台以上のときのみ。§6.3 |
| UI-14 | フッター | `footer` | 表示 | 「Temp Master Dashboard v1.0 - Built with jQuery + Bootstrap 3」（要確認 Q-09） |

表 2-1 期間セレクトの選択肢

| value | 表示 | API に渡す `time_scale` | 取得範囲（バックエンド） |
|---|---|---|---|
| `hour` | Last Hour | `hour` | 直近 3,600 秒 |
| `day`（初期値） | Last 24 Hours | `day` | 直近 86,400 秒 |
| `week` | Last 7 Days | `week` | 直近 604,800 秒 |
| `month` | Last 30 Days | `month` | 直近 2,592,000 秒 |
| `year` | Last Year | `year` | 直近 31,536,000 秒 |

UI-15 レイアウト・スタイル（`<style>` の主な値）

- `body`: 背景 `#f5f5f5`、`padding-top: 70px`（固定ナビバー分）
- グリッド: `col-md-4 col-sm-6` → 幅 ≥992px で 3 列、≥768px で 2 列、それ未満で 1 列（Bootstrap 3 の既定ブレークポイント）
- パネル見出し `.panel-default > .panel-heading`: 背景 `#f8f8f8`。見出し内は flex で左に名称（+バッジ）、右にデバイス種別タグ
- デバイス種別タグ `.device-type-tag`: 11px、文字 `#777`、背景 `#eee`、角丸 10px
- 値ラベル `.meter-stats .label`: 14px、`padding: 4px 8px`、右マージン 6px。`.meter-stats` 下マージン 10px
- チャート領域 `.meter-chart-wrap`: `position: relative; height: 200px`
- 最終更新 `.meter-last-updated`: 12px、`#777`、上マージン 8px
- 未更新セクション: 見出し 18px / 600 / `#8a6d3b`、サブ見出し 12px、パネル枠 `#f0ad4e`・背景 `#fcf8e3`、空文言 `.stale-meter-empty` は `#8a6d3b`
- フッター: 中央寄せ 12px `#777`、`margin: 30px 0 20px`
- ナビバーの折りたたみ（ハンバーガー）は定義されていない

---

## 3. 定数・状態

| ID | 名前 | 値 / 初期値 | 用途 |
|---|---|---|---|
| ST-01 | `API_URL` | `'https://snakeroom.fly.dev'`（固定） | メーター系 API のベース URL |
| ST-02 | `REFRESH_INTERVAL` | `30000`（ms） | 自動更新間隔 |
| ST-03 | `currentTimeScale` | `'day'` | 現在の期間 |
| ST-04 | `STALE_METER_THRESHOLD_MS` | `7 * 24 * 60 * 60 * 1000`（7 日） | 未更新判定のしきい値 |
| ST-05 | `metersData` | `[]` | 直近の `/api/meters` の `meters` |
| ST-06 | `statusData` | `null` | 直近の `/api/status` レスポンス |
| ST-07 | `charts` | `{}` | `device_id` → Chart インスタンス |
| ST-08 | `DISPLAY_NAMES` | §7 | 表示名置換マップ |

状態は URL・localStorage・Cookie に保存しない。リロードすると期間は `day` に戻る。

---

## 4. API

### 4.1 呼び出し先

| ID | 呼び出し | 方法 | ベース |
|---|---|---|---|
| API-01 | `GET /api/meters` | `$.ajax`（`dataType: 'json'`） | `API_URL`（snakeroom） |
| API-02 | `GET /api/status` | `$.ajax` | `API_URL` |
| API-03 | `GET /api/meters/{encodeURIComponent(device_id)}/history?time_scale={scale}` | `$.ajax`（`data: { time_scale }`） | `API_URL` |
| API-04 | `POST /api/meters/refresh`（ボディなし） | `$.ajax`（`type: 'POST'`） | `API_URL` |
| API-05 | `GET /api/backup` | `fetch('/api/backup')` | **同一オリジン**（本番では temp-master.fly.dev 自身） |

- 認証ヘッダー・Cookie は送らない。タイムアウト・リトライ指定なし（jQuery 既定）。
- バックエンドは CORS を全許可（`allow_origins=["*"]`、`allow_credentials=True`）。
- `$.ajax` のエラー時、コールバックに渡す文字列は `errorThrown || textStatus`。HTTP エラーでは通常ステータステキスト（例: `Internal Server Error`）、ネットワーク断では `error` などになる。
- メーター系（snakeroom）と Backup（同一オリジン）でデータの出どころが異なる（要確認 Q-01）。

### 4.2 バックエンドのレスポンス形（`main.py`）

日時は Pydantic の `datetime` を FastAPI が ISO 8601 文字列にしたもの。収集データは UTC の aware datetime なので `"2026-10-21T08:48:20+00:00"` 形式（`+00:00` 付き、マイクロ秒は値があれば付く）。

**API-01 `GET /api/meters`** — 200

```json
{
  "meters": [
    {
      "device_id": "string",
      "device_name": "string",
      "device_type": "string",
      "hub_device_id": "string | null",
      "current_temperature": "number | null",
      "current_humidity": "integer | null",
      "battery": "integer | null",
      "last_updated": "ISO8601 | null"
    }
  ],
  "last_updated": "ISO8601 | null"
}
```

- 並び順はバックエンドのメモリ上の dict の挿入順（起動時は `SELECT * FROM devices` の順、以後は新規検出順）。フロントは並べ替えない。
- 対象デバイス種別 `METER_DEVICE_TYPES`: `Meter`, `MeterPlus`, `WoIOSensor`, `Meter Plus (JP)`, `Meter Pro`, `Meter Pro CO2`, `Hub 2`。
- フロントが使うのは `meters` のみ（トップレベル `last_updated`、`hub_device_id` は未使用）。

**API-02 `GET /api/status`** — 200

```json
{
  "configured": true,
  "meters_count": 5,
  "is_rate_limited": false,
  "backoff_remaining": 0,
  "last_api_call": 1792570000.12,
  "collection_interval": 3600
}
```

- `is_rate_limited` = 現在時刻 < `backoff_until`。`backoff_remaining` = 残り秒（整数、0 以上）。SwitchBot API が 429 を返すとバックオフ `min(60 * 2^連続エラー数, 600)` 秒。
- フロントが使うのは `meters_count`、`is_rate_limited`、`backoff_remaining` のみ。

**API-03 `GET /api/meters/{device_id}/history?time_scale=`** — 200

```json
{
  "device_id": "string",
  "time_scale": "hour|day|week|month|year",
  "history": [
    { "timestamp": "ISO8601", "temperature": 24.3, "humidity": 48, "battery": 95 }
  ],
  "device": { "...MeterDevice と同じ形..." }
}
```

- `history` は DB（`readings` テーブル）から `timestamp >= 現在 - 範囲` を **昇順**で全件返す（間引きなし）。収集は 1 時間ごと（`DATA_COLLECTION_INTERVAL = 3600`）。
- `time_scale` 省略時の既定は `hour`（フロントは常に指定する）。
- エラー: 未知の `device_id` → 404 `{"detail":"Device not found"}`、不正な `time_scale` → 422。
- フロントが使うのは `history[].timestamp` と `history[].temperature` のみ（湿度・バッテリーの履歴は描画しない）。

**API-04 `POST /api/meters/refresh`** — 200

```json
{ "status": "ok", "message": "Data collection triggered", "meters_count": 5 }
```

- SwitchBot の認証情報（`SWITCHBOT_TOKEN` / `SWITCHBOT_SECRET`）が未設定なら 500 `{"detail":"SwitchBot credentials not configured"}`。
- 設定済みなら `collect_data()` を**同期的に**完了まで待ってから返す（全デバイスの状態取得。台数に比例して時間がかかる）。
- フロントはレスポンス本文を使わない（成功/失敗のみ）。

**API-05 `GET /api/backup`** — 200

- SQLite のスナップショットを `application/x-sqlite3` で返す。`Content-Disposition: attachment; filename="switchbot_backup_YYYYMMDD_HHMMSS.db"`（UTC）。送信後にサーバー側の一時ファイルを削除。
- DB ファイルなし → 404 `{"detail":"Database file not found"}`。
- `main` の実装では認証なし（Q-02）。

**共通（ミドルウェア）**

- 全レスポンスに `X-Request-ID`（12 桁 hex）。
- 未処理例外 → 500 `{"detail":"Internal Server Error","request_id":"..."}`。`HTTPException` による 500（例: refresh の認証情報未設定）は `{"detail": "..."}` のみで `request_id` は本文に入らない。
- `/api/` 配下で 5xx のとき Slack アラートをバックグラウンド送信（`alerts.py`）。

フロントが呼ばない API: `/healthz`、`/api/latency-logs`、`/api/latency-stats`、`POST /api/import`。

---

## 5. 振る舞い

### BEH-01 初期表示

1. `$(document).ready` で `fetchData()` を 1 回実行し、`setInterval(fetchData, 30000)` を登録。
2. 応答までは UI-09「Loading temperature data...」のみ表示（ステータスバー・エラーは非表示、接続ラベルは「Connected」のまま）。

### BEH-02 データ取得 `fetchData()`

1. API-01 を呼び、**成功してから** API-02 を呼ぶ（直列。`Promise.all` なし）。
2. 両方成功したら:
   - `metersData = metersResp.meters`（なければ `[]`）、`statusData = statusResp`
   - ローディングとエラーを非表示、接続ラベルを緑「Connected」
   - `updateStatusBar()`（BEH-05）→ `renderMeters()`（§6）→ `renderCharts()`（§8）
3. API-01 失敗: `showError('Failed to fetch meters: ' + err)`（API-02 は呼ばない）
4. API-02 失敗: `showError('Failed to fetch status: ' + err)`
5. 失敗時は `metersData` / `statusData` を更新せず、既存のパネル・ステータスバー・レート制限警告はそのまま残る。初回から失敗した場合はステータスバーは出ない。

### BEH-03 自動更新

- 30 秒ごとに BEH-02 を実行。前回の取得が終わっていなくても次を開始する（多重実行の抑止なし）。
- 毎回メーターパネルの HTML を丸ごと作り直し、未更新でない全メーターの履歴（API-03）を取り直す。1 回の更新で `2 + アクティブ台数` 回のリクエストが発生する。
- 期間選択（`currentTimeScale`）は維持される。

### BEH-04 期間の変更

- `#time-scale-select` の `change` で `currentTimeScale` を更新 → `destroyAllCharts()`（全チャート破棄、`charts = {}`）→ `renderCharts()`。
- API-01 / API-02 は呼ばず、パネル HTML も作り直さない（既存の canvas に再描画）。

### BEH-05 ステータスバー `updateStatusBar()`

- `statusData` が null なら非表示にして終了。
- 左: `'Monitoring ' + count + ' ' + (count === 1 ? 'meter' : 'meters')`。`count = statusData.meters_count || 0`（`/api/meters` の件数ではなく status の値）。
- 右: `'Last refresh: ' + HH:MM:SS`（**ブラウザのローカル時刻**、取得成功時点。`pad2` でゼロ埋め）。
- その後ステータスバーを表示。

### BEH-06 レート制限警告

- `statusData.is_rate_limited` が真なら `#rate-limit-text` を `'SwitchBot API rate limit reached. Retry in ' + (backoff_remaining || 0) + ' seconds.'` にして表示、偽なら非表示。
- 残り秒はカウントダウンしない（次回の取得まで固定表示）。
- 表示位置はステータスバーの下（ステータスバーとは独立した要素）。

### BEH-07 エラー表示 `showError(msg)`

- ローディング非表示、`#error-text` に `msg`、エラーを表示、接続ラベルを赤「Disconnected」。
- エラーは次に BEH-02 が成功したとき非表示になる（手動で閉じる手段はない）。
- Download Backup の失敗でも接続ラベルが「Disconnected」になる（Q-05）。

エラー文言一覧

| 契機 | 文言（`Error.` に続く部分） |
|---|---|
| API-01 失敗 | `Failed to fetch meters: {err}` |
| API-02 失敗 | `Failed to fetch status: {err}` |
| API-04 失敗 | `Failed to refresh: {err}` |
| API-05 非 2xx・本文に `request_id` あり | `Failed to download backup (HTTP {status}). Request ID: {request_id}` |
| API-05 非 2xx・`request_id` なし or JSON でない | `Failed to download backup (HTTP {status}).` |
| API-05 通信例外 | `Failed to download backup: {err}`（`err` は `TypeError: Failed to fetch` など） |

API-03（履歴）の失敗はエラー表示しない（BEH-12）。

### BEH-08 Refresh Data

1. ボタンを disabled にし文言「Refreshing...」。
2. API-04 を呼ぶ。失敗なら `showError('Failed to refresh: ' + err)`。
3. 成否にかかわらず `fetchData()` を呼び、**その直後に**ボタンを有効化して「Refresh Data」に戻す（`fetchData` の完了は待たない）。
4. 結果: API-04 が失敗しても続く `fetchData()` が成功すればエラーはすぐ消え、接続ラベルも「Connected」に戻る（§14 で確認。Q-06）。

### BEH-09 Download Backup

1. ボタンを disabled にし文言「Downloading...」。
2. `fetch('/api/backup')`（同一オリジン、認証なし）。
3. `res.ok` でなければ本文を JSON として読み、§BEH-07 の文言で `showError`（ダウンロードはしない）。
4. 成功なら `Content-Disposition` から `filename="..."` を正規表現 `/filename="?([^";]+)"?/` で取り出し（取れなければ `switchbot_backup.db`）、Blob → ObjectURL → 一時 `<a download>` をクリックして保存、ObjectURL を解放。
5. `finally` でボタンを有効化し「Download Backup」に戻す。

### BEH-10 表示名の置換 `getDisplayName(name)`

- `DISPLAY_NAMES[name] || name`。完全一致のみ（前後空白・大小文字の正規化なし）。マップにない名前はそのまま表示。
- 置換するのは表示だけ。API に送る値・canvas の ID は `device_id` を使う。

### BEH-11 未更新判定 `isStaleMeter(meter)`

次のいずれかなら「未更新」:

- `last_updated` が falsy（null / 空文字）
- `new Date(last_updated)` が Invalid Date
- `Date.now() - last_updated >= 7 日`（**ちょうど 7 日も未更新**。クライアント時計で判定）

判定は `fetchData` 成功時の描画と `renderCharts` のたびに行う。期間変更（BEH-04）ではパネルの振り分けは変わらない。

### BEH-12 履歴の取得とチャートの破棄・再描画 `renderCharts()`

- `metersData` の各メーターについて:
  - 未更新なら、既存チャートがあれば `destroy()` して `charts` から削除し、履歴は取得しない。
  - それ以外は API-03 を呼び、成功したら `renderSingleChart(device_id, data.history || [])`。失敗したら何もしない（canvas は空のまま、エラー表示なし）。
- `renderSingleChart` は `#chart-{device_id}` がなければ何もしない。既存インスタンスがあれば `destroy()` してから新規作成。
- 自動更新（BEH-03）ではパネル HTML を先に置き換えるため、古いチャートは DOM から外れた canvas に残り、新しい履歴の描画時に `destroy()` される。履歴取得に失敗するとそのインスタンスは次回成功まで残る。
- リクエスト同士の順序は制御しない（期間を素早く切り替えたとき、遅れて返った古い期間の応答で描画される可能性がある。Q-07）。

### BEH-13 HTML エスケープ

API 由来の文字列（`device_id`、表示名、`device_type`、温湿度・バッテリー値、最終更新文字列）は `escapeHtml`（`& < > " '`）を通して HTML 文字列に埋め込む。

---

## 6. メーターパネル

### 6.1 振り分け `renderDefaultView()`

- `metersData` を API の順のまま「アクティブ」と「未更新」（BEH-11）に分ける。
- アクティブが 1 台以上なら `.row` のグリッドを出力（0 台なら何も出さない）。
- 未更新が 1 台以上なら、その後ろに未更新セクション（§6.3）を出力。
- `#meters-container` の中身を丸ごと置き換える。メーター 0 台のときコンテナは空で、「メーターがありません」等の文言は出ない（Q-08）。

### 6.2 パネル構造 `createMeterPanel(meter, isStale)`

```
.panel.panel-default
  .panel-heading > .meter-panel-header
    .meter-panel-title
      <strong>{表示名}</strong>
      [未更新のみ] span.label.label-warning.stale-meter-badge「7日以上未更新」
    span.device-type-tag {device_type}
  .panel-body
    .meter-stats
      [温度が null/undefined でない] span.label.label-danger「{温度}°C」
      [湿度が null/undefined でない] span.label.label-info「{湿度}%」
      [バッテリーが null/undefined でない] span.label.label-success「{バッテリー}%」
    [アクティブ] .meter-chart-wrap > canvas#chart-{device_id}
    [未更新]     p.stale-meter-empty「履歴データの取得対象外」
    [last_updated あり] p.meter-last-updated「Last updated: {new Date(last_updated).toLocaleString()}」
    [last_updated なし かつ 未更新] p.stale-meter-empty「値がありません（データ未受信）」
```

- 値は JS の数値→文字列変換そのまま（小数桁を揃えない）。例: `18.0` → `18°C`、`24.3` → `24.3°C`。
- 温度 `0` も表示する（null / undefined 判定のため）。
- バッテリーはアイコン・「Battery」等の見出しなしで `%` のみ。色はしきい値によらず常に緑（例: 12% も緑）。値が null（Hub 2 など）ならラベル自体を出さない。
- 湿度とバッテリーはどちらも `%` 表記で、色（青 / 緑）でのみ区別される（Q-04）。
- 最終更新は `toLocaleString()` なので、表記はブラウザのロケール・タイムゾーン依存（ja-JP / Asia/Tokyo では `2026/10/21 17:48:20`）（Q-03）。
- `last_updated` が不正な日付文字列の場合（未更新扱い）、`Invalid Date` と表示される。

### 6.3 未更新メーターセクション

```
.meter-section
  .meter-section-header
    h3.meter-section-title  [glyphicon-warning-sign] 未更新のメーター
    p.meter-section-subtitle 1週間以上更新されていないデバイス
  .panel.panel-warning.stale-meters-panel > .panel-body > .row
    .col-md-4.col-sm-6 > createMeterPanel(meter, true) …
```

---

## 7. 表示名マップ `DISPLAY_NAMES`（23 件）

| SwitchBot のデバイス名 | 表示名 |
|---|---|
| Bedroom Meter | 第1蒸留塔 (T-101) |
| Living Meter | 第2蒸留塔 (T-102) |
| 2世 | 反応器 (R-201) |
| 夢男 | 熱交換器 (E-301) |
| 夢 | 熱交換器 (E-302) |
| アワコ | 冷却塔 (CT-401) |
| ジャガ百万石 | 加熱炉 (H-501) |
| ネズミ | コンプレッサー (C-601) |
| バロン | 遠心分離機 (S-701) |
| ゴンタ | 混合槽 (M-801) |
| 蛇棚 | 貯蔵タンク (TK-901) |
| 中華棚 | 貯蔵タンク (TK-902) |
| へておケージ | 配管ライン (PL-1001) |
| 外 | 屋外モニター (EM-1101) |
| インキュベーター | 乾燥機 (D-1201) |
| ビアク | 吸収塔 (A-1301) |
| ブロッチ Hot Spot | フレアスタック (FS-1401) |
| マダラアオジタ | ボイラー (B-1501) |
| Study Hub | 制御盤 (CP-1601) |
| Livingroom Hub | 制御盤 (CP-1602) |
| Bedroom Hub | 制御盤 (CP-1603) |
| ガー子ケージ | 配管ライン (PL-1002) |
| 極道 | 粉砕機 (G-1701) |

---

## 8. チャート（Chart.js 2.9.4）

### 8.1 X 軸ラベル `formatTimestamp(timestamp, timeScale)`

`new Date(timestamp)` を**ブラウザのローカルタイムゾーン**で整形する（`pad2` で 2 桁ゼロ埋め）。

| 期間 | 形式 | 例（Asia/Tokyo） |
|---|---|---|
| hour | `HH:mm` | `17:48` |
| day | `HH:mm` | `17:48` |
| week | `{曜日略称} HH`（**時のみ**、日付なし） | `Wed 21`（= 水曜 21 時） |
| month | `{月略称} {日}`（日はゼロ埋めなし） | `Oct 21` |
| year | `{月略称} {日}` | `Sep 11` |
| その他 | `toLocaleString()`（現行 UI からは到達しない） | — |

曜日略称 `Sun..Sat`、月略称 `Jan..Dec`（英語固定）。week の `Wed 21` は「21 日」と誤読しやすい（Q-10）。

### 8.2 設定

| 項目 | 値 |
|---|---|
| type | `line` |
| データ | `labels` = 8.1 の文字列、`data` = `history[].temperature`（湿度は描かない） |
| dataset label | `Temperature (C)`（凡例非表示のため画面には出ない） |
| 線 | `borderColor: '#d9534f'`、`borderWidth: 2`、`lineTension: 0.4`、`fill: true`、`backgroundColor: 'rgba(217, 83, 79, 0.15)'` |
| 点 | `pointRadius: 3`、`pointBackgroundColor` / `pointBorderColor: '#d9534f'`、ホバー時 `pointHoverRadius: 5`・`pointHoverBackgroundColor: '#5bc0de'` |
| サイズ | `responsive: true`、`maintainAspectRatio: false`（親 `.meter-chart-wrap` の高さ 200px） |
| 凡例 | `legend.display: false` |
| ツールチップ | `mode: 'index'`、`intersect: false`。タイトルは X ラベル、本文は `yLabel.toFixed(1) + '°C'`（null/undefined なら空） |
| X 軸 | 表示、グリッド色 `rgba(0,0,0,0.05)`、`ticks: { maxTicksLimit: 8, fontSize: 10, fontColor: '#777' }` |
| Y 軸 | 表示、グリッド同上、`ticks: { fontSize: 10, fontColor: '#777', callback: value + '°' }`。最小・最大の指定なし（Chart.js 2 の自動。0 始まりではない） |
| アニメーション | 指定なし（Chart.js 2 の既定アニメーションあり） |

- 履歴 0 件のときも空のチャート（Y 軸 0°〜1°、X ラベルなし）が描かれる。
- 点は間引かない。year では最大でおよそ 1 時間 1 点 × 1 年分になる（Q-11）。

---

## 9. 文言一覧

画面に出る固定文言（英語と日本語が混在、翻訳機構なし）。

| 場所 | 文言 |
|---|---|
| title / ブランド | Temp Master Dashboard |
| ナビメニュー | Dashboard |
| 接続ラベル | Connected / Disconnected |
| 期間ラベル | Time Range: |
| 期間選択肢 | Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year |
| ボタン | Refresh Data / Refreshing... / Download Backup / Downloading... |
| ステータスバー | Monitoring {n} meter / Monitoring {n} meters / Last refresh: {HH:MM:SS} |
| レート制限 | Rate Limited. SwitchBot API rate limit reached. Retry in {n} seconds.（既定文言 `SwitchBot API rate limit reached.`） |
| ローディング | Loading temperature data... |
| エラー | Error. {§BEH-07 の文言}（既定 `Failed to fetch data.`） |
| 値ラベル | {t}°C / {h}% / {b}% |
| 最終更新 | Last updated: {toLocaleString} |
| 未更新セクション | 未更新のメーター / 1週間以上更新されていないデバイス |
| 未更新バッジ | 7日以上未更新 |
| 未更新パネル | 履歴データの取得対象外 / 値がありません（データ未受信） |
| フッター | Temp Master Dashboard v1.0 - Built with jQuery + Bootstrap 3 |

UI 規則（ボード共通事項）: タイトル／ナビバーは「Temp Master Dashboard」、UI に「Snake」「SnakeRoom」を出さない。現行 UI も満たしている（`API_URL` の `snakeroom` はコード内のみで画面には出ない）。

---

## 10. アクセシビリティ・その他の現状

- 期間セレクトには `<label for>` あり。ボタンは `type="button"`。
- 警告アイコンは `aria-hidden="true"`。チャートの canvas に代替テキストなし。
- 接続状態・エラー・レート制限の表示に `role="alert"` / `aria-live` なし。
- キーボード操作は標準要素のみ（独自のショートカットなし）。

---

## 11. 移行時に維持すべき外部仕様（まとめ）

React 版で同じ結果になることを確認する対象。テストケース台帳はこの粒度で作る想定。

1. UI-01〜UI-14 の要素・文言・初期表示（§2、§9）
2. 期間選択肢と初期値 `day`、API-03 の `time_scale`（表 2-1）
3. 30 秒ごとの自動更新と、期間の維持（BEH-03）
4. ステータスバーの単複（meter / meters）と `meters_count` の採用元（BEH-05）
5. レート制限警告の文言・表示条件（BEH-06）
6. エラー文言と接続ラベルの切り替え（BEH-07）
7. Refresh / Backup ボタンの disabled と文言、Backup のファイル名決定（BEH-08、BEH-09）
8. 表示名置換（§7、BEH-10）
9. 未更新判定と未更新セクションの構成・文言（BEH-11、§6.3）
10. 値ラベルの表示条件・色・単位（§6.2）
11. X 軸ラベル形式とツールチップ形式（§8）
12. API 由来文字列のエスケープ（BEH-13。React では JSX の既定エスケープで満たす）

---

## 12. 移行時の扱いを決める必要がある現行の癖

コードどおりの挙動だが、不具合とも仕様とも読める点。React 版でそのまま再現するか直すかを §13 で決める。

| ID | 現行の挙動 | 根拠 |
|---|---|---|
| K-01 | 初期表示（取得前）から接続ラベルが緑「Connected」 | UI-02 の静的 HTML |
| K-02 | Refresh 失敗のエラーが、続く `fetchData` 成功で即座に消える。ボタンは `fetchData` 完了前に元に戻る | BEH-08 |
| K-03 | Backup 失敗で接続ラベルが「Disconnected」になる（メーター API は正常でも） | BEH-07、BEH-09 |
| K-04 | 自動更新の多重実行を抑止しない。毎回パネルを作り直し全履歴を再取得 | BEH-03 |
| K-05 | 期間切り替え時のリクエスト競合を制御しない | BEH-12 |
| K-06 | 履歴取得失敗は無表示（canvas が空のまま） | BEH-12 |
| K-07 | メーター 0 台で空状態の文言がない | §6.1 |
| K-08 | レート制限の残り秒がカウントダウンしない | BEH-06 |
| K-09 | ステータスバーの台数は `/api/status` の `meters_count`。`/api/meters` の件数と食い違っても表示はそのまま | BEH-05 |
| K-10 | 値の小数桁が揃わない（`18°C` と `24.3°C`） | §6.2 |
| K-11 | バッテリー残量によらず緑 | §6.2 |

---

## 13. 要確認一覧

推測で決めず、移行の判断者に確認する項目。

| ID | 内容 | 現行 | 確認したいこと |
|---|---|---|---|
| Q-01 | API の向き先 | メーター系は `https://snakeroom.fly.dev` 固定、Backup だけ同一オリジン（temp-master 自身の DB） | React 版の API ベース URL（環境変数で切替えるか、既定値は snakeroom か同一オリジンか）。Backup の向き先を変えるか |
| Q-02 | Backup の認証 | `main` の `/api/backup` は認証なし、フロントも認証ヘッダーを送らない。なお snakeroom 側の `/api/backup` は未認証だと 401 を返すことを過去に確認している | 移行対象に認証付き Backup を含めるか（含めるならトークンの渡し方） |
| Q-03 | 日時の表記 | 最終更新は `toLocaleString()`（ブラウザ依存）、ステータスバーと X 軸はローカル時刻 | 表記をブラウザ依存のままにするか、固定形式・固定タイムゾーン（例: JST）にするか。ベースライン比較ではロケール・TZ を固定する必要あり |
| Q-04 | 湿度とバッテリーの区別 | どちらも `{n}%`、色のみで区別 | 見出し・アイコンを付けるか、現行どおりか |
| Q-05 | Backup 失敗時の接続ラベル（K-03） | 「Disconnected」になる | 再現するか |
| Q-06 | Refresh 失敗時のエラーの消え方（K-02） | すぐ消える | 再現するか、エラーを残すか |
| Q-07 | 期間切替の競合（K-05）・多重実行（K-04） | 制御なし | React 版で最新リクエストのみ採用・多重実行防止にしてよいか |
| Q-08 | 0 台時の空状態（K-07） | 何も出ない | 空状態文言を追加するか |
| Q-09 | フッター文言 | 「v1.0 - Built with jQuery + Bootstrap 3」 | React 版での文言（バージョン表記・技術名） |
| Q-10 | week の X 軸ラベル | `Wed 21`（曜日＋時） | 現行どおりか、`Wed 21:00` 等に変えるか |
| Q-11 | year の点数 | 間引きなし（最大約 8,760 点/台） | 間引き・点の非表示を入れてよいか |
| Q-12 | `<html lang="en">` | 英語指定で日本語文言が混在 | `lang` と UI 言語の方針 |
| Q-13 | 初期の接続ラベル（K-01） | 取得前から「Connected」 | 再現するか、取得中は別表示にするか |
| Q-14 | その他の癖 K-06、K-08〜K-11 | §12 | 現行どおり再現でよいか |
| Q-15 | 対応ブラウザ・画面幅 | 明示なし（Bootstrap 3 のブレークポイントのみ） | React 版のサポート対象 |

---

## 14. 検証記録（この仕様書を書くために実施した確認）

コード読解に加え、`main`（`b580faa`）の `index.html` を**無改変**で実ブラウザに読み込み、挙動を確認した。

- バックエンド: ローカルで `fastapi run app/main.py`（`DB_PATH=/tmp/...`、SwitchBot 認証情報なし）。`POST /api/import` で 5 台を投入（直近更新・Hub 2（バッテリー null）・6 日 23 時間前更新・10 日前更新・`last_updated` なし）。
- ブラウザ: Playwright（Chromium、1280×900、`ja-JP` / `Asia/Tokyo`）。`https://snakeroom.fly.dev/**` へのリクエストだけをローカル FastAPI に中継し、本番・実 SwitchBot API には一切アクセスしていない。レート制限・API エラー・0 台はレスポンスを差し替えて再現。

確認結果（抜粋、スクリプト出力）

```
status: Monitoring 5 meters / Last refresh: 17:48:47
panels: ['第1蒸留塔 (T-101)', '制御盤 (CP-1601)', 'Unmapped Meter', 'コンプレッサー (C-601)', '屋外モニター (EM-1101)']
stale panels: ['コンプレッサー (C-601)', '屋外モニター (EM-1101)']
canvases: ['chart-DEV-A1', 'chart-DEV-B2', 'chart-DEV-C3']
x labels A1 week  ['Wed 21', 'Thu 01', 'Wed 17', 66]
x labels A1 month ['Sep 21', 'Sep 22', 'Oct 21', 204]
backup filename: switchbot_backup_20261021_084856.db
after refresh click btn: Refresh Data  error visible: False  (#error-text = 'Failed to refresh: Internal Server Error')
rate: Rate Limited. SwitchBot API rate limit reached. Retry in 123 seconds. | Monitoring 1 meter
error: Error. Failed to fetch meters: Internal Server Error | conn: Disconnected | loading visible: False | statusbar visible: False
empty: Monitoring 0 meters | container html len: 0
loading: True Loading temperature data...
backup err: Error. Failed to download backup (HTTP 500). Request ID: abc123def456 | conn: Disconnected
requests: GET /api/meters, GET /api/status, GET /api/meters/{id}/history (アクティブ 3 台のみ), POST /api/meters/refresh, GET http://<同一オリジン>/api/backup
```

自動更新と期間変更のリクエスト順（経過秒、3 秒後に month へ変更）

```
(0.1, 'GET', '/api/meters', '')
(0.1, 'GET', '/api/status', '')
(0.1, 'GET', '/api/meters/DEV-A1/history', 'time_scale=day')   ※DEV-B2 / DEV-C3 も同時刻
(3.1, 'GET', '/api/meters/DEV-A1/history', 'time_scale=month') ※期間変更: meters/status は呼ばない
(30.1, 'GET', '/api/meters', '')                                ※30 秒後の自動更新
(30.1, 'GET', '/api/status', '')
(30.1, 'GET', '/api/meters/DEV-A1/history', 'time_scale=month') ※期間 month を維持
```

確認できなかったこと

- 実際の SwitchBot API が 429 を返したときのバックオフ（`/api/status` の応答を差し替えて画面側のみ確認）。
- 認証情報ありの `POST /api/meters/refresh` 成功時（実 API を呼ぶため未実施）。
- 30 秒自動更新は 1 周期分のみ確認。長時間の動作・多重実行（K-04）・期間切替の競合（K-05）はコード読解のみ。
- 本番（temp-master.fly.dev / snakeroom.fly.dev）の実データでの表示。
