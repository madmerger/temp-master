# Phase 2: iOS E2E 結果

Xcode 26.6 (17F113) / iOS 27.0 (24A434) / iPhone 17
SHA: `3df5079a4c41ba9b667922f4c311f5cfc91f6f0a`

PASS: 22 / FAIL: 1 / NOT_RUN: 0 / N/A: 1

## 判断が必要な点: TC-18

凍結 expected と spec.md §既知の仕様差 (iOS Standalone は Hub 3 を収集対象に含める) の矛盾による差分。legacy 18 ID は全て含まれ、差分 3 件はすべて Hub 3。アプリ不具合ではない — 期待値の扱いは要判断。

- `overall` / `key_results.meter_device_ids`: **FAIL**。期待はlegacyの18 ID、実測は21 ID。凍結expectedは変更していない。
- 情報キー `legacy_ids_subset_of_ios`: **PASS / true**。
- 情報キー `extra_ids_all_hub3`: **PASS**。下表の3 IDを記録。
- `all_active_have_temperature`: **PASS / true**。全21台が今回の実API収集で更新済み、温度はnullではない。UIの21台表示とHub 3カードは画像、ID集合と全台温度は端末SQLiteのread-only実測で確認した。
- 最初の不一致検出時に停止・報告。その後、leadが`spec.md:39`を根拠に仕様差と判断し、FAILを維持して続行する指示を受領した。Appコードは変更していない。

| 追加device_id | deviceType |
|---|---|
| B0E9FE83F0D4 | Hub 3 |
| B0E9FEB9CFA6 | Hub 3 |
| B0E9FED60DD2 | Hub 3 |

## ケース別結果

| TC | ケース | 結果 | 備考 |
|---|---|---|---|
| TC-01 | 起動時ダッシュボード表示 | PASS |  |
| TC-02 | アクティブメーターカード (表示名変換あり) | PASS |  |
| TC-03 | #69 追加の表示名変換・バッテリー null | PASS |  |
| TC-04 | 表示名マッピング無し・特殊文字を含むデバイス名のエスケープ | PASS |  |
| TC-05 | 未更新メーターセクション | PASS |  |
| TC-06 | データ未受信の未更新メーター | PASS |  |
| TC-07 | 値ありの未更新メーター (数値表記) | PASS |  |
| TC-08 | Time Range 選択肢と初期値 | PASS |  |
| TC-09 | Time Range 切替でのグラフ点数とラベル書式 (SEED-D1) | PASS | 点数はXCUITestのN pointsを実測。軸ラベルはTC-09_hour/day/week/month/year.pngのD1グラフを視覚確認。右端はSwift Chartsが重複回避で省略。 |
| TC-10 | Refresh Data (バックエンド未設定クレデンシャル) | PASS |  |
| TC-11 | バックエンド停止時のエラー表示 | PASS | 127.0.0.1:8000へ直接接続してバックエンドを停止。proxy生成502ではなく実URLSession接続失敗を確認。 |
| TC-12 | レート制限警告表示 | PASS |  |
| TC-13 | Download Backup | PASS |  |
| TC-14 | レイテンシ統計 | PASS | TC-14.pngの全7統計値を視覚確認。初回AX採取は結合labelのためnullとなり、画像で確定。 |
| TC-15 | レイテンシログ一覧とフィルタ | PASS |  |
| TC-16 | データインポート | PASS |  |
| TC-17 | ヘルスチェック・ステータス | PASS |  |
| TC-18 | Standalone: SwitchBot 実機からの収集 | FAIL | 凍結 expected と spec.md §既知の仕様差 (iOS Standalone は Hub 3 を収集対象に含める) の矛盾による差分。legacy 18 ID は全て含まれ、差分 3 件はすべて Hub 3。アプリ不具合ではない — 期待値の扱いは要判断; UIのMonitoring 21 metersとHub 3カードを画像で確認。ID集合とactive温度は実収集後の端末SQLiteをread-onlyで実測。全21台が今回更新済み。 |
| TC-19 | 30秒自動更新 | PASS |  |
| TC-20 | 本番 snakeroom への Remote 接続 (読み取りのみ) | PASS | ProductionをSettingsで選択。GETのみ。Refresh/Import未実行 |
| TC-21 | 日本語ローカライズ | PASS |  |
| TC-22 | Download Backup 失敗時の Request ID 表示 | PASS |  |
| TC-23 | 5xx 時 Slack アラート (サーバー側) | N/A | N/A (V-06: Slack はサーバー側) |
| TC-24 | Standalone: 端末内バックアップ | PASS | 実収集後のStandalone UIでDownload Backup→共有画面を確認。今回新規生成された端末tmpファイルをread-onlyで検証。; tablesはアプリテーブルを比較。SQLite内部のsqlite_sequenceは除外し、all_sqlite_tablesには全テーブルを記録。 |

## 未検証項目と理由
- TC-23: N/A (V-06: Slack はサーバー側)
- 指定されたiOS 23ケースは実施済み。NOT_RUNは0件。TC-18のFAILがあるため「全件合格」とは扱わない。

## 実行方法と証跡の区別

- Remoteは凍結reset/seedをscratchへ抽出したローカルFastAPI（8000 / 8002）を使用。観測用のlocalhost:8898 proxyは実API応答を記録し、Refresh/Backupのみ1.25秒遅延させてloading表示を採取した。応答をstubしていない。
- TC-11は追加でlocalhost:8000へ直接接続してbackendを停止し、実URLSessionの接続拒否を確認した。実エラーは`Failed to fetch meters: Could not connect to the server.`。
- TC-20はSettingsでProductionを選択。画面前後のGET `/api/status`は双方HTTP 200 / 22台、UIはConnected / Monitoring 22 meters。本番へのRefresh/Importは実行していない。前後値はJSONの`production_before` / `production_after`に保存。
- TC-09の点数1/2/3/4/5はXCUITestの`N points`。軸書式は5期間の追加PNGで視覚確認した。Swift Chartsが重複回避で省略したtickは比較対象へ捏造追加していない。
- TC-14は統計の結合AX label採取が初回nullになったため、全7値をPNGで確認して確定。テストコードの数値抽出も調整した。
- 初回はLatency limitのnumberPadがタブ操作を遮蔽し、Settingsへの遷移がハーネス上で中断した。残件を新規起動に分離し、Settings/Import/35秒更新/異常系を再実行して測定を完了した。
- Standalone認証は環境秘密参照をSecureFieldへ入力してKeychainへ保存。入力は録画・成果物画像に含めず、実API収集後だけを記録した。APIやデータはmock/stubしていない。
- TC-24は今回UIで生成した`switchbot_backup_20261013_053913.db`（36,864 bytes / 21 devices / 21 readings）をread-onlyで検証。SQLiteヘッダと3アプリテーブルを確認した。内部テーブル`sqlite_sequence`は別途`all_sqlite_tables`に記録。
- TC-23.pngは明記したN/A説明カードであり、アプリ操作のスクリーンショットではない。
- JSONは24ケースの必要フィールドと画像参照を確認。各`expected`は凍結cases.jsonと完全一致。Appソースとdocs/ios-migrationは変更なし。既定TempMaster schemeのTestActionはTempMasterTests / TempMasterUITestsのみ、独立TempMasterE2E schemeはTempMasterE2ETestsのみ。commit/pushは行っていない。

## 録画

- 指定のsimctl録画（repo外、約86秒）: `/Users/devin/ios-artifacts/e2e_main_flow.mp4`
- **共有推奨の注釈付き動画**（同一操作を収録、別フローではない）: `/Users/devin/screencasts/ios-main-flow/ios-main-flow-edited.mp4`
- Dashboard→Last 7 Days→未更新→Refresh→Latency→Import→Settings→日本語Mock。最後の日本語部分がMockであることを注釈に明示した。ユーザーへの共有動画は1本に絞る。

## 秘密値スキャン

実行コマンド: `python3 -B scripts/scan_e2e_secrets.py`

- 対象: E2E Swiftコード、project.yml、scripts、e2e-results（画像のバイト列も含む）。
- 環境のSWITCHBOT_TOKEN / SWITCHBOT_SECRETと_2組、FLY_API_TOKEN / FLY_API_TOKEN_SNAKEROOMの実値をstdin patternの`grep -a -F -l -f -`および完全一致走査で照合。値はargv・ログ・成果物に出力していない。
- 一般tokenパターン5種（Fly / GitHub / Bearer / private key / credential literal）も走査。
- 結果: **39 files / 完全一致grep一致ファイル0 / Findings 0 / exit 0**。
- 画像と主要フロー動画も平文認証値が映らないことを確認した。この走査は成果物とE2Eコードが対象で、Simulator Keychainの保存済み認証を削除するものではない。

## 再測定用コード

- `scripts/run_e2e.sh`は独立schemeを実行する。凍結scratch harnessとbackendの準備が前提。既存の8898 receiverが起動している場合は停止してから再起動する。
- `TempMasterE2ETests/`にRemote・Mock・ProductionのUI手順を配置。TC-09の軸は画像での確認が必要。
- TC-18/24はSecureFieldの手動入力→実収集→Backup共有画面を撮影した後、`python3 -B scripts/measure_standalone.py`で端末DBと新規backupを測定する。実API失敗や未収集の状態をPASSにしない。
- 再実行は結果JSON/summaryを更新するため、今回の証跡を残す場合は先に退避する。
