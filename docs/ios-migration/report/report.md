# temp-master iOS 移植 テスト結果レポート

- 対象: `madmerger/temp-master` (FastAPI + jQuery ダッシュボード) → SwiftUI iOS アプリ
- 移植元基準: `main` `b580faa` (#69 表示名追加・#72 Slack アラート/バックアップ反映済み)
- PR: 仕様・台帳・レガシー実測 [#74](https://github.com/madmerger/temp-master/pull/74) (`3de578c`) / iOS 実装・E2E [#75](https://github.com/madmerger/temp-master/pull/75) (アプリ `3df5079`、E2E 成果物 `95f3b7a`) / 本レポート (report PR)
- 期待値: `docs/ios-migration/cases.json` v2 (TC-01〜TC-24)。**実測後に期待値は一切変更していない。**

## 1. 結論

| 項目 | 結果 |
|---|---|
| E2E 比較 (24 ケース) | MATCH 19 / iOS のみ PASS 3 / 仕様どおりの差分 1 / レガシーのみ 1 / **不一致 0** |
| レガシー実測 (21 ケース) | 21 PASS |
| iOS E2E (24 ケース) | 22 PASS / 1 FAIL (TC-18、仕様どおりの差分) / 1 N/A (TC-23) |
| iOS ユニット / UI テスト | 42 / 42、8 / 8 PASS (xcodebuild test) |
| ローカライズキー検証 | PASS (en 91 / ja 91 キー一致) |
| バックエンドテスト | 106 passed (pytest) |
| CI / Devin Review | #74 全 green。#75 の指摘は修正済み、または判断理由をスレッドに返信済み |

## 2. テスト環境

| 区分 | 環境 |
|---|---|
| レガシー | Ubuntu、Python 3.12 + Poetry、FastAPI (`uvicorn app.main:app`)、Playwright Chromium で旧画面 `index.html` を実測 |
| iOS | macOS、Xcode 26.6 (17F113)、iPhone 17 Simulator / iOS 27.0 (24A434)、XCUITest |
| 共通フィクスチャ | `harness/reset_and_seed.sh` で SEED-D1〜D7 を投入、`results/import_extra.json` で TC-16 |
| 実機・本番 | TC-18 / TC-24 は実際の SwitchBot Cloud API、TC-20 は本番 `snakeroom.fly.dev` に GET のみ |

## 3. ケース別比較

判定の意味:
- MATCH: レガシーと iOS の両方が、同じ凍結期待値に PASS
- IOS_ONLY_PASS: iOS 専用ケース (Mock / Standalone) が PASS
- KNOWN_DIFF: spec.md「既知の仕様差」に当たる差分
- LEGACY_ONLY: サーバー側だけの機能

{{CASE_TABLE}}

### 3.1 TC-18 の差分 (KNOWN_DIFF)

- 期待値は、レガシーで実測したデバイス ID 18 件です。iOS Standalone は 21 件を収集しました。
- `compare.py` で両方の実測値を突き合わせ、次の 2 点を確認しました。
  - レガシーの 18 件は、すべて iOS 側に含まれる。
  - 増えた 3 件 (`B0E9FE83F0D4`, `B0E9FEB9CFA6`, `B0E9FED60DD2`) は、すべて種別 `Hub 3`。
- 本番データには `Hub 3` 種別のデバイスがあります。そのため spec.md「既知の仕様差」では、iOS Standalone の収集対象を「バックエンドの `METER_DEVICE_TYPES` + `Hub 3`」と定めています。
- 以上から、アプリの不具合ではなく仕様どおりの差分と判定しました。
- その他のキーは PASS です: 全アクティブメーターに温度あり、UI 表示 `Monitoring 21 meters`。
- iOS からも Hub 3 を外す場合は `SwitchBotClient.supportedDeviceTypes` から `Hub 3` を除けば一致します。

### 3.2 TC-23 (LEGACY_ONLY)

- 5xx 時の Slack アラート (B-20) はサーバーの運用監視機能なので、台帳 V-06 に従いバックエンド側に残しました。
- 端末に Slack Bot Token を置かないためです。iOS では 5xx 時に Request ID を表示します (TC-22 で確認)。
- レガシー側は `tests/test_error_alerts.py` とバックエンドテスト全件で PASS しています。

## 4. 台帳カバレッジ

{{TRACE_TABLE}}

E2E でカバーしていない台帳行の確認方法:

| 台帳 ID | 確認方法 |
|---|---|
| L-14 フッター | `Localizable.strings` の `footer` = `Temp Master Dashboard v1.0 - Built with SwiftUI` をコードで確認 (技術名だけを変えた意図的な差分)。画面は TC-01 のスクリーンショットで確認 |
| V-03 クレデンシャル保管 | Keychain 保存 (`KeychainStore`)、入力欄は SecureField。コードレビューで確認。ユニットテストは `testMockSettingsDoNotTouchKeychain` のみ |
| V-04 通信 | `AppInfoPlistTests.testLaunchLocalizationAndScopedATSConfiguration` (ATS 例外が localhost / 127.0.0.1 のみ) |
| V-05 インポート入力検証 | `RemoteMeterServiceTests.testImportRejectsInvalidPayloadWithoutSendingRequest` と SQLite のトランザクション実装 |

## 5. 主要画面 (レガシー / iOS)

{{SCREENS}}

## 6. 未テスト・制約

- 実機 iPhone での動作は未確認です (Simulator のみ)。
- 共有シートで保存したバックアップ DB を、別の端末やツールで開けるかは未確認です。
- 本番環境 (TC-20) は読み取りのみで確認しました。本番に対する Refresh / Import / Backup は実行していません。
- TC-09 の X 軸ラベル書式は、iOS ではスクリーンショットの目視で確認しました。点数は XCUITest のアクセシビリティ値で確認しています。
- Swift Charts は重なりを避けるため、右端のラベルを省略することがあります。
- 運用者が判断する Devin Review の指摘 (#75 にスレッドで理由を返信済み):
  1. 履歴取得に失敗したとき、前のグラフが残る。レガシーと同じ挙動です。
  2. Refresh 失敗の後に取得が成功すると、エラー表示が消える。レガシーと同じ挙動で、TC-10 の期待値どおりです。
  3. 収集の途中でクレデンシャルを削除しても、その回の収集は旧トークンのまま最後まで進む。
  4. E2E 用ローカルサーバー `e2e_host.py` の `/reset` と `/stop-backend` に認証がない。127.0.0.1 だけで待ち受け、テスト実行中にだけ動くものです。

## 7. 成果物

- `docs/ios-migration/ledger.md` / `spec.md` / `cases.json`: 台帳・仕様・凍結済み期待値
- `docs/ios-migration/results/legacy.json`, `legacy_screens/`: レガシーの実測結果
- `docs/ios-migration/results/ios/ios.json`, `ios_screens/`, `ios_summary.md`: iOS E2E の実測結果 (#75 `95f3b7a` から転記)
- `docs/ios-migration/report/compare.py`: 比較スクリプト。`comparison.json` / `comparison.md` (キー別の詳細) / `traceability.md` を生成する
- 録画: iOS Simulator のメインフロー (約 2 分)。PR に添付
