# temp-master iOS 移植 テスト結果レポート

- 対象: temp-master（SwitchBot 温湿度ダッシュボード: FastAPI + SQLite + jQuery フロント）→ SwiftUI iOS アプリ
- 関連 PR: 台帳・仕様・共通ケース・レガシー実測 https://github.com/madmerger/temp-master/pull/64 / iOS 実装 https://github.com/madmerger/temp-master/pull/67（検証コミット `63e469c`）
- 実施日: 2026-09-30（UTC）
- 判定基準: `docs/ios-migration/cases.json`（TC-01〜TC-21）の `expected`。レガシーと iOS の両方で同じケースを実測して比較

## 1. 結果サマリ

| 区分 | 対象 | 結果 |
|---|---|---|
| 既存バックエンド pytest | switchbot-backend | 97 / 97 passed |
| レガシー Web 実測（Playwright） | cases.json の legacy-web 対象 19 件 | 19 / 19 期待値一致 |
| iOS ユニットテスト（XCTest） | TempMasterTests | 66 / 66 passed |
| iOS UI テスト（XCUITest） | TempMasterUITests | 7 / 7 passed |
| ローカライズキー一致（en / ja） | `scripts/check_localization.sh` | OK |
| iOS E2E（Simulator 手動操作・録画） | cases.json の iOS 対象 21 件 | 合格 20 / 不一致 1（TC-18、仕様上の意図的差分） |
| GitHub CI（Backend Tests） | PR #64 / #67 | 両方 passed |

結論: レガシーサービスの機能（台帳 L-01〜L-14、B-01〜B-18、V-01〜V-05）はすべて iOS アプリに実装され、共通ケースで期待値どおりに動作することを確認しました。唯一の不一致（TC-18）は、本番環境に存在する `Hub 3` を iOS Standalone で収集対象に加えたことによる、仕様書どおりの差分です。

## 2. 環境

| 項目 | 値 |
|---|---|
| レガシー | Python（Poetry 仮想環境 3.14）、FastAPI、ローカル :8000（認証情報なし・シード DB）、実 SwitchBot 収集は別ポート :8001（収集後停止）、本番 `https://snakeroom.fly.dev`（読み取りのみ） |
| レガシー UI 実測 | Playwright Chromium（`docs/ios-migration/harness/legacy_runner.py`） |
| iOS | Xcode 27.0 RC（`DEVELOPER_DIR=/Applications/Xcode-27.0-RC.app`）、iPhone 17 Simulator / iOS 27.0、デプロイターゲット iOS 17.0 |
| シード | `docs/ios-migration/harness/reset_and_seed.sh`（相対時刻の 6 台・履歴 11 件・レイテンシ 4 件）。変更系ケース後に再シード |

## 3. ケース別結果（レガシー vs iOS）

| TC | 内容 | 台帳 | レガシー | iOS | 備考 |
|---|---|---|---|---|---|
| TC-01 | 起動時ダッシュボード | L-01,L-02,L-06,B-06 | 一致 | 合格 | Connected / Monitoring 6 meters |
| TC-02 | アクティブカード（表示名変換） | L-08,B-01,B-03 | 一致 | 合格 | 第1蒸留塔 (T-101) 22.3°C / 80% / 20% |
| TC-03 | 表示名マッピング無し・電池 null | B-01,B-03 | 一致 | 合格 | Study Hub、電池ラベル非表示 |
| TC-04 | 特殊文字名のエスケープ | V-01 | 一致 | 合格 | `Tag <b>&</b>` を文字列表示 |
| TC-05 | 未更新セクション | L-09,B-02 | 一致 | 合格 | アクティブ 4 / 未更新 2 |
| TC-06 | データ未受信の未更新メーター | L-09,B-02 | 一致 | 合格 | |
| TC-07 | 値ありの未更新メーター（数値表記） | L-09,B-03 | 一致 | 合格 | `19°C`（19.0 → 19） |
| TC-08 | Time Range 選択肢と初期値 | L-03,B-04 | 一致 | 合格 | 5 択・初期 Last 24 Hours |
| TC-09 | 期間切替の点数とラベル書式 | L-10,B-04,B-05 | 一致 | 合格（修正後） | 点数 1/2/3/4/5、書式一致 |
| TC-10 | Refresh（バックエンド認証情報なし） | L-04,B-07 | 一致 | 合格 | POST 500 → 再取得 200 → Connected・エラー非表示 |
| TC-11 | バックエンド停止時エラー | L-07,B-08 | 一致 | 合格 | Disconnected、`Failed to fetch meters: …` |
| TC-12 | レート制限警告 | L-05,B-09 | 対象外（iOS Mock のみ） | 合格 | 警告全文一致 |
| TC-13 | Download Backup | L-04,B-10 | 一致 | 合格 | `switchbot_backup_YYYYMMDD_HHMMSS.db`、先頭 `SQLite format 3` |
| TC-14 | レイテンシ統計 | L-11,B-11 | 一致 | 合格（修正後） | total 4 / avg 137.625 / min 50 / max 300 / 成功 2 / 失敗 2 / 50.0% |
| TC-15 | レイテンシログとフィルタ | L-11,B-12 | 一致 | 合格 | 新しい順、endpoint・device 各 1 件、limit 2 件 |
| TC-16 | データインポート | L-12,B-13 | 一致 | 合格 | 1 台・2 履歴、7 台表示・遠心分離機 (S-701) |
| TC-17 | ヘルスチェック・ステータス | L-13,B-14 | 一致 | 合格 | 接続 OK、configured No / 6 台 / 制限なし / 3600 秒 |
| TC-18 | Standalone 実 SwitchBot 収集 | B-15,B-16,B-17 | 一致（18 台） | **不一致**（21 台） | 下記 4 章。全 21 台に温度あり、API 22 呼出すべて 200 |
| TC-19 | 30 秒自動更新 | B-06 | 一致 | 合格 | 無操作中に Last refresh が更新 |
| TC-20 | 本番 snakeroom 接続（読み取り） | B-18 | 一致（22 台） | 合格 | 同時点の `/api/status` と一致（22 台） |
| TC-21 | 日本語ローカライズ | V-02 | 対象外（iOS Mock のみ） | 合格 | 日本語の更新ボタン・未更新見出し |

## 4. 不一致 → 原因 → 対処

| # | 不一致 | 原因 | 対処 | 状態 |
|---|---|---|---|---|
| 1 | TC-09: Last Hour（1 点）で X 軸ラベルが出ない。Week / Month でラベルが重なる | Swift Charts の自動目盛は幅 0 の時間範囲で目盛を作らず、近接点のラベル衝突を処理していなかった | 1〜8 点はデータ点ごとにラベル（Chart.js のカテゴリラベルに合わせる）、衝突ラベルは間引き、1 点時は ±30 分の範囲で中央表示（`63e469c`、ユニットテスト追加） | 修正・再テスト合格 |
| 2 | TC-09: ラベルの集合・間隔が Chart.js と完全には同じにならない | Chart.js はカテゴリ軸（等間隔）、Swift Charts は時間比例軸のため近接点のラベルは間引かれる | プラットフォーム差として許容。判定は点数・ラベル書式・重なり無しで実施 | 既知差分 |
| 3 | TC-14: 平均が `137.6` 表示（API 値 137.625） | 小数 1 桁に丸めて表示していた | 平均・最小・最大は API 値をそのまま表示（`137.625` / `50` / `300`）（`63e469c`） | 修正・再テスト合格 |
| 4 | TC-18: レガシー 18 台に対し iOS 21 台 | レガシーの収集対象種別に `Hub 3` が無い。本番 API は `Hub 3` を返しており、spec.md で iOS Standalone の対象を `METER_DEVICE_TYPES + Hub 3` と定義 | 仕様どおり（修正不要）。レガシー 18 台はすべて含まれ、追加 3 台はすべて Hub 3 | 意図的差分 |
| 5 | TC-10: 押下中の `Refreshing...` 表示を E2E で捕捉できず | バックエンドが即時 500 を返すため表示が瞬間的 | 最終状態（Connected・エラー非表示）とサーバーログ（POST 500 → GET 200）で判定。表示ロジックはユニットテストで確認 | 観測上の制約 |
| 6 | TC-16: アクセシビリティ API での文字入力だけでは Import ボタンが有効にならなかった | テスト操作（AX の値設定）で SwiftUI の変更通知が発火しなかった | 実キーボード入力で実施。アプリのバグとは断定していない | 手順上の制約 |

### E2E 前のコードレビューで修正した項目（`d49c3b5`）

- 設定画面が 2 つ目の AppEnvironment を生成し、Standalone で収集が二重に走り得た → 単一の環境を共有
- バックアップのファイル名（Content-Disposition）にパストラバーサルの余地 → ファイル名をサニタイズ
- デバイス ID を URL パスに未エンコードで埋め込み → パスセグメントとしてエンコード（Remote / SwitchBot 両方）
- Keychain の保護属性を `AfterFirstUnlockThisDeviceOnly` に変更、保存失敗時にエラー表示
- 不要な Documents 共有（`UIFileSharingEnabled` 等）を削除
- インポートのトランザクションで SQLite 戻り値検査とステートメント解放を徹底
- ナビゲーションタイトルの省略表示を解消、ローカライズ対象外の数値表示を `Text(verbatim:)` に

## 5. レガシー実測で判明した既存挙動（iOS も同じ挙動を再現）

- 月・年表示で異なる UTC 時刻が同じローカル日付ラベル（例: `Sep 29` が 2 つ）になる
- Refresh 失敗時のエラーは直後の再取得結果で上書きされる（再取得も失敗すると `Failed to fetch meters: …` が残る）
- 本番の `/api/status` の収集間隔は 120 秒で、リポジトリのコード（3600 秒）と異なる。iOS Standalone はリポジトリどおり 3600 秒
- 本番 `/api/status` に未知フィールド `user_configured` がある。iOS は未知フィールドを無視

## 6. 未実施・制約

- 実機（iPhone / iPad）での署名付きビルドは未実施（Simulator のみ）。PR #67「人間がするべきテスト」に記載
- 検証は iPhone 17 / iOS 27.0 のみ。iOS 17〜26 や iPad のレイアウトは未確認（Xcode.app 同梱の iOS 26.5 ランタイムが未インストールのため Xcode 27.0 RC を使用）
- 本番環境では Refresh・Import などの変更操作をしていない（読み取りのみ）
- Standalone の実収集は 1 回のみ（API 負荷を避けるため）。1 時間周期の自動収集の長時間動作は未確認
- TC-19 の 30 秒周期は「無操作中に更新された」ことの確認で、周期の厳密な計測ではない
- GitHub CI は既存の Backend Tests のみで、iOS のビルド・テストは CI に組み込まれていない（ローカルで実行）

## 7. 成果物

- 台帳・仕様・共通ケース: `docs/ios-migration/ledger.md`, `spec.md`, `cases.json`, `fixtures.md`（PR #64）
- レガシー実測: `docs/ios-migration/results/legacy.json`, `results/legacy_screens/`, `results/phase1_pytest.log`（PR #64）
- iOS E2E: `docs/ios-migration/results/ios_e2e.json`, `results/ios_screens/`, `results/ios_e2e_report.md`（本 PR）
- トレーサビリティ: `docs/ios-migration/traceability.md`（本 PR）
- iOS アプリ: `ios/TempMaster/`（PR #67）
