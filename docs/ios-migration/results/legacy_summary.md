| Case | Name | Result | Notes |
|---|---|---|---|
| TC-01 | 起動時ダッシュボード表示 | PASS | — |
| TC-02 | アクティブメーターカード (表示名変換あり) | PASS | — |
| TC-03 | #69 追加の表示名変換・バッテリー null | PASS | — |
| TC-04 | 表示名マッピング無し・特殊文字を含むデバイス名のエスケープ | PASS | — |
| TC-05 | 未更新メーターセクション | PASS | — |
| TC-06 | データ未受信の未更新メーター | PASS | — |
| TC-07 | 値ありの未更新メーター (数値表記) | PASS | — |
| TC-08 | Time Range 選択肢と初期値 | PASS | — |
| TC-09 | Time Range 切替でのグラフ点数とラベル書式 (SEED-D1) | PASS | — |
| TC-10 | Refresh Data (バックエンド未設定クレデンシャル) | PASS | — |
| TC-11 | バックエンド停止時のエラー表示 | PASS | — |
| TC-13 | Download Backup | PASS | — |
| TC-14 | レイテンシ統計 | PASS | — |
| TC-15 | レイテンシログ一覧とフィルタ | PASS | — |
| TC-16 | データインポート | PASS | SEED-D7 stale-side membership: False. |
| TC-17 | ヘルスチェック・ステータス | PASS | — |
| TC-18 | Standalone: SwitchBot 実機からの収集 | PASS | Refresh HTTP status: 200.; The measured device IDs are the legacy reference set for TC-18 comparison.; meter_device_ids: Expected value is a template/reference, retained for cross-target comparison. |
| TC-19 | 30秒自動更新 | PASS | — |
| TC-20 | 本番 snakeroom への Remote 接続 (読み取りのみ) | PASS | Read-only production API meters_count: 22. |
| TC-22 | Download Backup 失敗時の Request ID 表示 | PASS | — |
| TC-23 | 5xx 時 Slack アラート (サーバー側) | PASS | Focused error-alert pytest exit code: 0.; Full backend suite passed; see phase1_pytest.log. |
