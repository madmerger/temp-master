# 画面・業務ルール・検証 台帳 (凍結版 v1)

移行元: `switchbot-dashboard/switchbot-frontend/index.html` (jQuery + Bootstrap 3 + Chart.js) と `switchbot-dashboard/switchbot-backend/app/main.py` (FastAPI + aiosqlite)。
移行先: iOS アプリ `ios/TempMaster` (SwiftUI + Swift Charts + SQLite3)。
乖離がある場合は本台帳が正。行 ID は実装・テストケース (cases.json) から参照する。

## L: 画面要素

| ID | 移行元要素 | 文言/挙動 (移行元) | iOS での対応 |
|---|---|---|---|
| L-01 | `<title>` / navbar brand | `Temp Master Dashboard` | ダッシュボードのナビゲーションタイトル `Temp Master Dashboard` |
| L-02 | 接続ステータスバッジ `#connection-status` | `Connected` (緑) / `Disconnected` (赤) | ツールバーのバッジ、同文言・同配色 |
| L-03 | Time Range セレクト | `Last Hour` / `Last 24 Hours` (初期) / `Last 7 Days` / `Last 30 Days` / `Last Year` | Picker (同順・同文言・初期 `Last 24 Hours`) |
| L-04 | ボタン | `Refresh Data` (押下中 `Refreshing...` で無効化) / `Download Backup` | 同文言ボタン。Backup は共有シート (ファイル保存) |
| L-05 | レート制限警告 `#rate-limit-warning` | `Rate Limited.` + `SwitchBot API rate limit reached. Retry in N seconds.` | 同文言の警告バナー |
| L-06 | ステータスバー `#status-bar` | `Monitoring N meter(s)` / `Last refresh: HH:MM:SS` | 同文言のステータス行 |
| L-07 | ローディング / エラー | `Loading temperature data...` / `Error.` + メッセージ | 同文言 |
| L-08 | メーターカード | 表示名 (太字) / デバイス種別タグ / 温度 `N°C` (赤) / 湿度 `N%` (水色) / 電池 `N%` (緑) / グラフ / `Last updated: <ローカル日時>` | 同構成のカード。iPhone は 1 列、iPad は 2〜3 列グリッド (移行元 col-md-4 col-sm-6 相当) |
| L-09 | 未更新セクション | 見出し `未更新のメーター` / 副題 `1週間以上更新されていないデバイス` / バッジ `7日以上未更新` / `履歴データの取得対象外` / 値なし時 `値がありません（データ未受信）` | 同文言。黄色系パネル |
| L-10 | 温度グラフ | 折れ線 + 塗り (#d9534f)、Y軸 `N°`、ツールチップ `N.N°C`、X軸ラベル最大 8 | Swift Charts LineMark + AreaMark、同色。点数をアクセシビリティ値 `N points` で公開 |
| L-11 | (移行元 UI なし・API のみ) `/api/latency-logs`, `/api/latency-stats` | — | レイテンシ画面 (統計 + ログ一覧 + フィルタ) を新設 |
| L-12 | (移行元 UI なし・API のみ) `/api/import` | — | インポート画面 (JSON ファイル選択 → 結果件数表示) を新設 |
| L-13 | (移行元 UI なし・API のみ) `/healthz`, `/api/status` | — | 設定画面 (データソース切替・URL・クレデンシャル・接続テスト・ステータス) を新設 |
| L-14 | フッター | `Temp Master Dashboard v1.0 - Built with jQuery + Bootstrap 3` | `Temp Master Dashboard v1.0 - Built with SwiftUI` (技術名のみ変更・意図的乖離) |

## B: 業務ルール

| ID | ルール | 移行元の根拠 |
|---|---|---|
| B-01 | 表示名変換 `DISPLAY_NAMES` (18 件)。未登録名はそのまま表示 | index.html `DISPLAY_NAMES`, `getDisplayName` |
| B-02 | 未更新判定: `last_updated` が null / 不正 / 現在から 7 日 (604,800,000ms) **以上** 前なら未更新。未更新はグラフ・履歴取得対象外で別セクション | `isStaleMeter`, `STALE_METER_THRESHOLD_MS` |
| B-03 | 数値表記は JavaScript の Number→文字列と同等 (19.0 → `19`, 22.3 → `22.3`)。null の値はラベル非表示 | `escapeHtml(meter.current_temperature)` |
| B-04 | 期間→取得範囲: hour 3600s / day 86400s / week 604800s / month 2592000s / year 31536000s。履歴は timestamp 昇順 | main.py `get_meter_history`, `get_readings_from_db` |
| B-05 | X軸ラベル書式 (端末ローカル時刻): hour/day `HH:mm`、week `Ddd HH`、month/year `Mon D` | `formatTimestamp` |
| B-06 | 自動更新 30 秒 (meters → status の順に取得し、成功時エラー非表示・Connected) | `REFRESH_INTERVAL`, `fetchData` |
| B-07 | Refresh: `POST /api/meters/refresh` → 失敗時 `Failed to refresh: <err>` 表示 → 続けて再取得 (成功すればエラーは消える) → ボタン復帰 | `#btn-refresh` handler |
| B-08 | 取得失敗: `Failed to fetch meters: ...` / `Failed to fetch status: ...`、Disconnected | `showError` |
| B-09 | レート制限: 429 受信で `consecutive_errors++`、待機 `min(60 * 2^errors, 600)` 秒。待機中は API を呼ばず 429 扱い。成功で errors=0。収集ループは 429 でデバイス巡回を中断 | `call_switchbot_api`, `collect_data` |
| B-10 | バックアップ: SQLite DB ファイルを `switchbot_backup_YYYYMMDD_HHMMSS.db` (UTC) でダウンロード | `/api/backup` |
| B-11 | レイテンシ統計: total / avg / min / max / success / failed / success_rate(%)、期間フィルタ (start/end)。0 件時 avg/min/max は null、rate 0 | `get_latency_stats` |
| B-12 | レイテンシログ: start/end/endpoint/device_id フィルタ、新しい順、limit (既定 100) | `get_latency_logs` |
| B-13 | インポート: devices を upsert、readings を追加。`Z` 付き ISO 日時を受理。件数を返す | `/api/import` |
| B-14 | ステータス: configured / meters_count / is_rate_limited / backoff_remaining / last_api_call / collection_interval (3600s) | `/api/status` |
| B-15 | SwitchBot 署名: `sign = Base64(HMAC-SHA256(secret, token + t + nonce))`、ヘッダ Authorization/Content-Type/charset/t/sign/nonce | `generate_switchbot_headers` |
| B-16 | 対象デバイス種別: Meter, MeterPlus, WoIOSensor, Meter Plus (JP), Meter Pro, Meter Pro CO2, Hub 2。`statusCode != 100` はエラー | `METER_DEVICE_TYPES`, `fetch_devices` |
| B-17 | 収集: デバイス一覧→各ステータス取得→temperature がある場合のみ現在値更新 + reading 保存 (humidity null→0)。全 API 呼び出しのレイテンシを記録。定期収集 3600s。readings 1 年超・latency_logs 30 日超を削除 | `collect_data`, `cleanup_*` |
| B-18 | データ取得先: 現行フロントは `https://snakeroom.fly.dev`。iOS は既定値を同 URL とし設定で変更可 | `API_URL` |

## V: 検証・セキュリティ

| ID | 項目 | iOS での扱い |
|---|---|---|
| V-01 | 移行元は HTML エスケープでデバイス名等を表示 | SwiftUI `Text` の verbatim 表示 (マークダウン/HTML 解釈しない) |
| V-02 | (新規) ローカライズ | en (移行元文言そのまま) + ja。キー完全一致をスクリプトで検証 |
| V-03 | (新規) クレデンシャル保管 | SwitchBot token/secret は Keychain に保存。ログ・画面に平文表示しない (入力欄は SecureField) |
| V-04 | (新規) 通信 | HTTPS 既定。ATS 例外は localhost / 127.0.0.1 のみ (ローカル検証用) |
| V-05 | (新規) インポート入力検証 | JSON デコード失敗・不正日時はエラー表示し部分適用しない (トランザクション) |
