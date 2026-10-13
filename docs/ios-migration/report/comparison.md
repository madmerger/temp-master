# レガシー vs iOS 比較結果

判定: MATCH = 両方が凍結済み期待値 (cases.json) に PASS。KNOWN_DIFF = spec.md「既知の仕様差」に該当する差分 (期待値は変更していない)。

| 判定 | 件数 |
|---|---|
| IOS_ONLY_PASS | 3 |
| KNOWN_DIFF | 1 |
| LEGACY_ONLY | 1 |
| MATCH | 19 |

| Case | 名前 | 対象 | レガシー | iOS | 判定 |
|---|---|---|---|---|---|
| TC-01 | 起動時ダッシュボード表示 | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-02 | アクティブメーターカード (表示名変換あり) | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-03 | #69 追加の表示名変換・バッテリー null | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-04 | 表示名マッピング無し・特殊文字を含むデバイス名のエスケープ | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-05 | 未更新メーターセクション | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-06 | データ未受信の未更新メーター | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-07 | 値ありの未更新メーター (数値表記) | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-08 | Time Range 選択肢と初期値 | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-09 | Time Range 切替でのグラフ点数とラベル書式 (SEED-D1) | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-10 | Refresh Data (バックエンド未設定クレデンシャル) | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-11 | バックエンド停止時のエラー表示 | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-12 | レート制限警告表示 | ios-mock | - | PASS | IOS_ONLY_PASS |
| TC-13 | Download Backup | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-14 | レイテンシ統計 | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-15 | レイテンシログ一覧とフィルタ | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-16 | データインポート | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-17 | ヘルスチェック・ステータス | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-18 | Standalone: SwitchBot 実機からの収集 | legacy-web, ios-standalone | PASS | FAIL | KNOWN_DIFF |
| TC-19 | 30秒自動更新 | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-20 | 本番 snakeroom への Remote 接続 (読み取りのみ) | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-21 | 日本語ローカライズ | ios-mock | - | PASS | IOS_ONLY_PASS |
| TC-22 | Download Backup 失敗時の Request ID 表示 | legacy-web, ios-remote | PASS | PASS | MATCH |
| TC-23 | 5xx 時 Slack アラート (サーバー側) | legacy-api | PASS | - | LEGACY_ONLY |
| TC-24 | Standalone: 端末内バックアップ | ios-standalone | - | PASS | IOS_ONLY_PASS |

## キー別の結果

### TC-01 起動時ダッシュボード表示

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| title | Temp Master Dashboard | PASS | Temp Master Dashboard | PASS | Temp Master Dashboard |
| connection | Connected | PASS | Connected | PASS | Connected |
| status_text | Monitoring 6 meters | PASS | Monitoring 6 meters | PASS | Monitoring 6 meters |
| last_refresh_regex | ^Last refresh: \d{2}:\d{2}:\d{2}$ | PASS | Last refresh: 04:13:19 | PASS | Last refresh: 22:26:54 |
| rate_limit_warning_visible | false | PASS | false | PASS | false |
| error_visible | false | PASS | false | PASS | false |

### TC-02 アクティブメーターカード (表示名変換あり)

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| display_name | 第1蒸留塔 (T-101) | PASS | 第1蒸留塔 (T-101) | PASS | 第1蒸留塔 (T-101) |
| device_type | MeterPlus | PASS | MeterPlus | PASS | MeterPlus |
| labels | ["22.3°C", "80%", "20%"] | PASS | ["22.3°C", "80%", "20%"] | PASS | ["22.3°C", "80%", "20%"] |
| last_updated_prefix | Last updated:  | PASS | Last updated:  | PASS | Last updated:  |
| has_chart | true | PASS | true | PASS | true |

### TC-03 #69 追加の表示名変換・バッテリー null

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| display_name | 制御盤 (CP-1601) | PASS | 制御盤 (CP-1601) | PASS | 制御盤 (CP-1601) |
| device_type | Hub 3 | PASS | Hub 3 | PASS | Hub 3 |
| labels | ["23.2°C", "75%"] | PASS | ["23.2°C", "75%"] | PASS | ["23.2°C", "75%"] |
| has_chart | true | PASS | true | PASS | true |

### TC-04 表示名マッピング無し・特殊文字を含むデバイス名のエスケープ

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| display_name | Tag <b>&</b> | PASS | Tag <b>&</b> | PASS | Tag <b>&</b> |
| device_type | Meter Pro CO2 | PASS | Meter Pro CO2 | PASS | Meter Pro CO2 |
| labels | ["25°C", "40%", "100%"] | PASS | ["25°C", "40%", "100%"] | PASS | ["25°C", "40%", "100%"] |

### TC-05 未更新メーターセクション

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| section_title | 未更新のメーター | PASS | 未更新のメーター | PASS | 未更新のメーター |
| section_subtitle | 1週間以上更新されていないデバイス | PASS | 1週間以上更新されていないデバイス | PASS | 1週間以上更新されていないデバイス |
| stale_display_names | ["冷却塔 (CT-401)", "コンプレッサー (C-601)"] | PASS | ["冷却塔 (CT-401)", "コンプレッサー (C-601)"] | PASS | ["冷却塔 (CT-401)", "コンプレッサー (C-601)"] |
| badge | 7日以上未更新 | PASS | 7日以上未更新 | PASS | 7日以上未更新 |
| no_history_text | 履歴データの取得対象外 | PASS | 履歴データの取得対象外 | PASS | 履歴データの取得対象外 |
| active_count | 4 | PASS | 4 | PASS | 4 |

### TC-06 データ未受信の未更新メーター

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| display_name | コンプレッサー (C-601) | PASS | コンプレッサー (C-601) | PASS | コンプレッサー (C-601) |
| labels | [] | PASS | [] | PASS | [] |
| no_value_text | 値がありません（データ未受信） | PASS | 値がありません（データ未受信） | PASS | 値がありません（データ未受信） |
| has_last_updated | false | PASS | false | PASS | false |
| has_chart | false | PASS | false | PASS | false |

### TC-07 値ありの未更新メーター (数値表記)

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| display_name | 冷却塔 (CT-401) | PASS | 冷却塔 (CT-401) | PASS | 冷却塔 (CT-401) |
| labels | ["19°C", "60%", "5%"] | PASS | ["19°C", "60%", "5%"] | PASS | ["19°C", "60%", "5%"] |
| has_last_updated | true | PASS | true | PASS | true |
| has_chart | false | PASS | false | PASS | false |

### TC-08 Time Range 選択肢と初期値

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| options | ["Last Hour", "Last 24 Hours", "Last 7 Days", "Last 30 Days… | PASS | ["Last Hour", "Last 24 Hours", "Last 7 Days", "Last 30 Days… | PASS | ["Last Hour", "Last 24 Hours", "Last 7 Days", "Last 30 Days… |
| default | Last 24 Hours | PASS | Last 24 Hours | PASS | Last 24 Hours |

### TC-09 Time Range 切替でのグラフ点数とラベル書式 (SEED-D1)

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| points | {"hour": 1, "day": 2, "week": 3, "month": 4, "year": 5} | PASS | {"hour": 1, "day": 2, "week": 3, "month": 4, "year": 5} | PASS | {"year": 5, "week": 3, "hour": 1, "month": 4, "day": 2} |
| label_regex | {"hour": "^\\d{2}:\\d{2}$", "day": "^\\d{2}:\\d{2}$", "week… | PASS | {"hour": ["03:43"], "day": ["02:13", "03:43"], "week": ["Sa… | PASS | {"hour": ["21:56"], "day": ["20:26"], "week": ["Fri 22", "M… |

- iOS note: 点数はXCUITestのN pointsを実測。軸ラベルはTC-09_hour/day/week/month/year.pngのD1グラフを視覚確認。右端はSwift Chartsが重複回避で省略。

### TC-10 Refresh Data (バックエンド未設定クレデンシャル)

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| refresh_http_status | 500 | PASS | 500 | PASS | 500 |
| button_during | Refreshing... | PASS | Refreshing... | PASS | Refreshing... |
| final_button | Refresh Data | PASS | Refresh Data | PASS | Refresh Data |
| final_connection | Connected | PASS | Connected | PASS | Connected |
| final_error_visible | false | PASS | false | PASS | false |

### TC-11 バックエンド停止時のエラー表示

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| connection | Disconnected | PASS | Disconnected | PASS | Disconnected |
| error_prefix | Failed to  | PASS | Failed to  | PASS | Failed to fetch meters: Could not connect to the server. |

- iOS note: 127.0.0.1:8000へ直接接続してバックエンドを停止。proxy生成502ではなく実URLSession接続失敗を確認。

### TC-12 レート制限警告表示

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| warning_title | Rate Limited. | - | null | PASS | Rate Limited. |
| warning_text | SwitchBot API rate limit reached. Retry in 120 seconds. | - | null | PASS | SwitchBot API rate limit reached. Retry in 120 seconds. |

### TC-13 Download Backup

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| button_during | Downloading... | PASS | Downloading... | PASS | Downloading... |
| final_button | Download Backup | PASS | Download Backup | PASS | Download Backup |
| http_status | 200 | PASS | 200 | PASS | 200 |
| filename_regex | ^switchbot_backup_\d{8}_\d{6}\.db$ | PASS | switchbot_backup_20261013_041322.db | PASS | switchbot_backup_20261013_052819.db |
| sqlite_header | true | PASS | true | PASS | true |
| contains_seed_devices | 6 | PASS | 6 | PASS | 6 |
| error_visible | false | PASS | false | PASS | false |

### TC-14 レイテンシ統計

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| total_calls | 4 | PASS | 4 | PASS | 4 |
| avg_latency_ms | 137.625 | PASS | 137.625 | PASS | 137.625 |
| min_latency_ms | 50.0 | PASS | 50.0 | PASS | 50.0 |
| max_latency_ms | 300.0 | PASS | 300.0 | PASS | 300.0 |
| successful_calls | 2 | PASS | 2 | PASS | 2 |
| failed_calls | 2 | PASS | 2 | PASS | 2 |
| success_rate | 50.0 | PASS | 50.0 | PASS | 50.0 |

- iOS note: TC-14.pngの全7統計値を視覚確認。初回AX採取は結合labelのためnullとなり、画像で確定。

### TC-15 レイテンシログ一覧とフィルタ

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| order_endpoints | ["/devices/SEED-D3/status", "/devices/SEED-D2/status", "/de… | PASS | ["/devices/SEED-D3/status", "/devices/SEED-D2/status", "/de… | PASS | ["/devices/SEED-D3/status", "/devices/SEED-D2/status", "/de… |
| filter_endpoint_count | 1 | PASS | 1 | PASS | 1 |
| filter_device_count | 1 | PASS | 1 | PASS | 1 |
| limit2_count | 2 | PASS | 2 | PASS | 2 |

### TC-16 データインポート

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| imported_devices | 1 | PASS | 1 | PASS | 1 |
| imported_readings | 2 | PASS | 2 | PASS | 2 |
| new_display_name | 遠心分離機 (S-701) | PASS | 遠心分離機 (S-701) | PASS | 遠心分離機 (S-701) |
| status_text | Monitoring 7 meters | PASS | Monitoring 7 meters | PASS | Monitoring 7 meters |

### TC-17 ヘルスチェック・ステータス

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| healthz | ok | PASS | ok | PASS | ok |
| configured | false | PASS | false | PASS | false |
| meters_count | 6 | PASS | 6 | PASS | 6 |
| is_rate_limited | false | PASS | false | PASS | false |
| collection_interval | 3600 | PASS | 3600 | PASS | 3600 |

### TC-18 Standalone: SwitchBot 実機からの収集

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| meter_device_ids | legacy 実測の device_id 集合と一致 | RECORDED | ["C76B0046301A", "CE2A4586263B", "D12D0346415D", "D13234351… | FAIL | ["B0E9FE83F0D4", "B0E9FEB9CFA6", "B0E9FED60DD2", "C76B00463… |
| all_active_have_temperature | true | PASS | true | PASS | true |

- iOS note: 凍結 expected と spec.md §既知の仕様差 (iOS Standalone は Hub 3 を収集対象に含める) の矛盾による差分。legacy 18 ID は全て含まれ、差分 3 件はすべて Hub 3。アプリ不具合ではない — 期待値の扱いは要判断
- iOS note: UIのMonitoring 21 metersとHub 3カードを画像で確認。ID集合とactive温度は実収集後の端末SQLiteをread-onlyで実測。全21台が今回更新済み。

### TC-19 30秒自動更新

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| last_refresh_changed | true | PASS | true | PASS | true |

### TC-20 本番 snakeroom への Remote 接続 (読み取りのみ)

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| status_text | Monitoring {GET /api/status の meters_count} meters | PASS | Monitoring 22 meters | PASS | Monitoring 22 meters |
| connection | Connected | PASS | Connected | PASS | Connected |

- iOS note: ProductionをSettingsで選択。GETのみ。Refresh/Import未実行

### TC-21 日本語ローカライズ

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| refresh_button | データ更新 | - | null | PASS | データ更新 |
| stale_section_title | 未更新のメーター | - | null | PASS | 未更新のメーター |

### TC-22 Download Backup 失敗時の Request ID 表示

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| http_status | 500 | PASS | 500 | PASS | 500 |
| body_request_id_regex | ^[0-9a-f]{12}$ | PASS | e847915dd3d3 | PASS | 197e1a69e4a7 |
| x_request_id_matches_body | true | PASS | true | PASS | true |
| error_regex | ^Failed to download backup \(HTTP 500\)\. Request ID: [0-9a… | PASS | Failed to download backup (HTTP 500). Request ID: e847915dd… | PASS | Failed to download backup (HTTP 500). Request ID: 197e1a69e… |
| connection | Disconnected | PASS | Disconnected | PASS | Disconnected |
| final_button | Download Backup | PASS | Download Backup | PASS | Download Backup |

### TC-23 5xx 時 Slack アラート (サーバー側)

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| pytest_test_error_alerts | all passed | PASS | all passed | - | null |

- iOS note: N/A (V-06: Slack はサーバー側)

### TC-24 Standalone: 端末内バックアップ

| キー | 期待値 | レガシー | レガシー実測 | iOS | iOS 実測 |
|---|---|---|---|---|---|
| filename_regex | ^switchbot_backup_\d{8}_\d{6}\.db$ | - | null | PASS | switchbot_backup_20261013_053913.db |
| sqlite_header | true | - | null | PASS | true |
| tables | ["devices", "latency_logs", "readings"] | - | null | PASS | ["devices", "latency_logs", "readings"] |

- iOS note: 実収集後のStandalone UIでDownload Backup→共有画面を確認。今回新規生成された端末tmpファイルをread-onlyで検証。
- iOS note: tablesはアプリテーブルを比較。SQLite内部のsqlite_sequenceは除外し、all_sqlite_tablesには全テーブルを記録。
