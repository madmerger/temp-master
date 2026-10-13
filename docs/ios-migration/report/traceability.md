# トレーサビリティ (台帳 → テストケース)

| 台帳 ID | 内容 | ケース (判定) |
|---|---|---|
| L-01 | `<title>` / navbar brand | TC-01(MATCH) |
| L-02 | 接続ステータスバッジ `#connection-status` | TC-01(MATCH) |
| L-03 | Time Range セレクト | TC-08(MATCH) |
| L-04 | ボタン | TC-10(MATCH), TC-13(MATCH), TC-22(MATCH) |
| L-05 | レート制限警告 `#rate-limit-warning` | TC-12(IOS_ONLY_PASS) |
| L-06 | ステータスバー `#status-bar` | TC-01(MATCH) |
| L-07 | ローディング / エラー | TC-11(MATCH), TC-22(MATCH) |
| L-08 | メーターカード | TC-02(MATCH) |
| L-09 | 未更新セクション | TC-05(MATCH), TC-06(MATCH), TC-07(MATCH) |
| L-10 | 温度グラフ | TC-09(MATCH) |
| L-11 | (移行元 UI なし・API のみ) `/api/latency-logs`, `/api/latency-stats` | TC-14(MATCH), TC-15(MATCH) |
| L-12 | (移行元 UI なし・API のみ) `/api/import` | TC-16(MATCH) |
| L-13 | (移行元 UI なし・API のみ) `/healthz`, `/api/status` | TC-17(MATCH) |
| L-14 | フッター | 未カバー (ユニットテスト側で確認) |
| B-01 | 表示名変換 `DISPLAY_NAMES` (23 件。#69 で `Study Hub`→`制御盤 (CP-1601)`, `Livingroom Hub`… | TC-02(MATCH), TC-03(MATCH), TC-04(MATCH) |
| B-02 | 未更新判定: `last_updated` が null / 不正 / 現在から 7 日 (604,800,000ms) **以上** 前なら未更新。未更新は… | TC-05(MATCH), TC-06(MATCH) |
| B-03 | 数値表記は JavaScript の Number→文字列と同等 (19.0 → `19`, 22.3 → `22.3`)。null の値はラベル非表示 | TC-02(MATCH), TC-03(MATCH), TC-07(MATCH) |
| B-04 | 期間→取得範囲: hour 3600s / day 86400s / week 604800s / month 2592000s / year 3153600… | TC-08(MATCH), TC-09(MATCH) |
| B-05 | X軸ラベル書式 (端末ローカル時刻): hour/day `HH:mm`、week `Ddd HH`、month/year `Mon D` | TC-09(MATCH) |
| B-06 | 自動更新 30 秒 (meters → status の順に取得し、成功時エラー非表示・Connected) | TC-01(MATCH), TC-19(MATCH) |
| B-07 | Refresh: `POST /api/meters/refresh` → 失敗時 `Failed to refresh: <err>` 表示 → 続けて再取… | TC-10(MATCH) |
| B-08 | 取得失敗: `Failed to fetch meters: ...` / `Failed to fetch status: ...`、Disconnected | TC-11(MATCH) |
| B-09 | レート制限: 429 受信で `consecutive_errors++`、待機 `min(60 * 2^errors, 600)` 秒。待機中は API を… | TC-12(IOS_ONLY_PASS) |
| B-10 | バックアップ: DB の一貫したスナップショット (SQLite Online Backup API) を `BACKUP_DIR/switchbot_bac… | TC-13(MATCH), TC-22(MATCH), TC-24(IOS_ONLY_PASS) |
| B-11 | レイテンシ統計: total / avg / min / max / success / failed / success_rate(%)、期間フィルタ (s… | TC-14(MATCH) |
| B-12 | レイテンシログ: start/end/endpoint/device_id フィルタ、新しい順、limit (既定 100) | TC-15(MATCH) |
| B-13 | インポート: devices を upsert、readings を追加。`Z` 付き ISO 日時を受理。件数を返す | TC-16(MATCH) |
| B-14 | ステータス: configured / meters_count / is_rate_limited / backoff_remaining / last_a… | TC-17(MATCH) |
| B-15 | SwitchBot 署名: `sign = Base64(HMAC-SHA256(secret, token + t + nonce))`、ヘッダ Autho… | TC-18(KNOWN_DIFF) |
| B-16 | 対象デバイス種別: Meter, MeterPlus, WoIOSensor, Meter Plus (JP), Meter Pro, Meter Pro C… | TC-18(KNOWN_DIFF) |
| B-17 | 収集: デバイス一覧→各ステータス取得→temperature がある場合のみ現在値更新 + reading 保存 (humidity null→0)。全 A… | TC-18(KNOWN_DIFF) |
| B-18 | データ取得先: 現行フロントは `https://snakeroom.fly.dev`。iOS は既定値を同 URL とし設定で変更可 | TC-20(MATCH) |
| B-19 | 全レスポンスに `X-Request-ID` (12 桁 hex) を付与。未処理例外は `500 {"detail":"Internal Server Er… | TC-13(MATCH), TC-22(MATCH) |
| B-20 | `/api/*` の 5xx で Slack (`SLACK_BOT_TOKEN` / `SLACK_ONCALL_ALERTS_CHANNEL_ID`) に… | TC-23(LEGACY_ONLY) |
| V-01 | 移行元は HTML エスケープでデバイス名等を表示 | TC-04(MATCH) |
| V-02 | (新規) ローカライズ | TC-21(IOS_ONLY_PASS) |
| V-03 | (新規) クレデンシャル保管 | 未カバー (ユニットテスト側で確認) |
| V-04 | (新規) 通信 | 未カバー (ユニットテスト側で確認) |
| V-05 | (新規) インポート入力検証 | 未カバー (ユニットテスト側で確認) |
| V-06 | (新規) サーバー運用機能の扱い | TC-23(LEGACY_ONLY) |
