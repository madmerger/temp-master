# Temp Master iOS 移行仕様書

## 1. 目的・スコープ
既存 Web サービス (FastAPI バックエンド + jQuery ダッシュボード) の全機能を iOS アプリへ移植する。行 ID は `ledger.md` 参照。

## 2. アーキテクチャ
- SwiftUI (iOS 17+) / Swift Charts / SQLite3 (システムライブラリ) / CryptoKit / Keychain。外部依存なし。XcodeGen (`ios/TempMaster/project.yml`)。
- データソースを `MeterService` プロトコルで抽象化し、2 モードを設定で切替:
  - **Remote**: 既存バックエンド API を利用 (既定 `https://snakeroom.fly.dev`)。全エンドポイント (`/healthz`, `/api/meters`, `/api/meters/{id}/history`, `/api/meters/refresh`, `/api/status`, `/api/latency-logs`, `/api/latency-stats`, `/api/import`, `/api/backup`) に対応。
  - **Standalone**: バックエンドの役割を端末内で実行。SwitchBot Cloud API v1.1 を直接呼び出し (B-15/B-16)、端末内 SQLite (移行元と同一スキーマ: devices / readings / latency_logs + インデックス) に保存。収集 (B-17)、レート制限バックオフ (B-09)、レイテンシ記録/統計 (B-11/B-12)、インポート (B-13)、バックアップ (DB ファイル共有, B-10)、古いデータ削除を移植。定期収集はアプリ前面時のタイマー (3600s) + 手動 Refresh。
- UI テスト用に `-UITestMockData` 起動引数でモックデータソースを使用。

## 3. 画面
| タブ | 内容 | 台帳 |
|---|---|---|
| Dashboard | タイトル/接続バッジ/Time Range/Refresh Data/Download Backup/ステータス/レート制限警告/メーターカード/未更新セクション/フッター | L-01〜L-10, L-14 |
| Latency | 統計カード + ログ一覧 (endpoint / device_id / limit / 期間フィルタ) | L-11 |
| Import | JSON ファイル選択 → インポート → 件数表示 | L-12 |
| Settings | データソース (Remote/Standalone)、バックエンド URL、SwitchBot Token/Secret (Keychain)、接続テスト (/healthz)、ステータス表示 | L-13 |

## 4. データ形式
JSON は移行元と同じ snake_case。日時は ISO-8601 (小数秒 0〜6 桁、`Z` / `+00:00` 両対応)。

## 5. 非機能
- ローカライズ: en / ja (`Resources/Localization/*.lproj`)、キー一致チェック `scripts/check_localization.sh`。
- セキュリティ: V-01〜V-05。

## 6. テスト
- ユニットテスト (XCTest): 署名・バックオフ・期間・未更新判定・ラベル書式・表示名・数値表記・JSON デコード・SQLite ストア・収集 (URLProtocol スタブ)・Remote クライアント・ViewModel・インポート。
- UI テスト (XCUITest, モック): ダッシュボード表示、Time Range、未更新セクション、レート制限、タブ遷移、ja 表示。
- E2E / クロス検証: `cases.json` をレガシー (Playwright 実測) と iOS (testing_agent) で実行し比較。

## 既知の仕様差（レガシー実測で判明）
- 本番 `/api/meters` には `Hub 3` 種別が含まれるが、バックエンド `METER_DEVICE_TYPES` には無い（本番の収集ロジックがリポジトリと異なる可能性）。iOS Standalone の収集対象は `METER_DEVICE_TYPES` + `Hub 3` とし、Remote は API が返すものをそのまま表示する。
- 本番 `/api/status` は `user_configured` を追加で返し、`collection_interval` は 120（リポジトリは 3600）。iOS の Codable は未知フィールドを無視する。
