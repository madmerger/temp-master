# トレーサビリティ（台帳 → 共通ケース → iOS 実装 → テスト）

- 台帳: `docs/ios-migration/ledger.md` / ケース: `docs/ios-migration/cases.json`
- iOS 実装パスは `ios/TempMaster/TempMaster/` 配下、テストは `ios/TempMaster/TempMasterTests/`・`TempMasterUITests/` 配下（PR #67）
- E2E 結果: `results/ios_e2e.json`、レガシー結果: `results/legacy.json`

## 画面（L）

| ID | 内容 | ケース | iOS 実装 | 自動テスト | レガシー | iOS E2E |
|---|---|---|---|---|---|---|
| L-01 | タイトル | TC-01 | Views/DashboardView.swift | UI: testDashboardShowsTitleConnectionAndCount | 一致 | 合格 |
| L-02 | 接続ステータス | TC-01 | Views/DashboardView.swift, ViewModels/DashboardViewModel.swift | UI: testDashboardShowsTitleConnectionAndCount / VMTests.testErrorSetsDisconnectedAndPrefix | 一致 | 合格 |
| L-03 | Time Range | TC-08 | Views/DashboardView.swift, Models/Models.swift (TimeScale) | UI: testTimeRangeHourShowsOnePoint | 一致 | 合格 |
| L-04 | Refresh / Backup ボタン | TC-10, TC-13 | Views/DashboardView.swift, Views/ShareSheet.swift | VMTests.testRefreshFailureThenLoadClearsError / SQLiteStoreTests.testBackupHasSQLiteHeader | 一致 | 合格 |
| L-05 | レート制限警告 | TC-12 | Views/DashboardView.swift | UI: testRateLimitWarning / VMTests.testRateLimitText | 対象外 | 合格 |
| L-06 | ステータスバー | TC-01 | ViewModels/DashboardViewModel.swift | VMTests.testStatusTextSingularAndPlural, testLastRefreshFormat | 一致 | 合格 |
| L-07 | ローディング / エラー | TC-11 | Views/DashboardView.swift | VMTests.testErrorSetsDisconnectedAndPrefix | 一致 | 合格 |
| L-08 | メーターカード | TC-02 | Views/MeterCardView.swift | UI: testMeterCardLabelsAndDisplayName | 一致 | 合格 |
| L-09 | 未更新セクション | TC-05〜07 | Views/StaleMetersSection.swift | UI: testStaleSectionShowsTwoCardsAndBadge | 一致 | 合格 |
| L-10 | 温度グラフ | TC-09 | Views/MeterChartView.swift | DomainTests（xAxisDates 4 件） / UI: testTimeRangeHourShowsOnePoint | 一致 | 合格（修正後） |
| L-11 | レイテンシ画面（新設） | TC-14, TC-15 | Views/LatencyView.swift, ViewModels/LatencyViewModel.swift | SQLiteStoreTests.testLatencyStatsSeeded, testLatencyStatsEmpty, testLatencyFilterOrderLimit / RemoteMeterServiceTests.testLatencyLogsQueryItems | 一致 | 合格（TC-14 修正後） |
| L-12 | インポート画面（新設） | TC-16 | Views/ImportView.swift, ViewModels/ImportViewModel.swift | VMTests.testPastedJSONSuccess, testInvalidJSONError | 一致 | 合格 |
| L-13 | 設定画面（新設） | TC-17 | Views/SettingsView.swift, ViewModels/SettingsViewModel.swift | VMTests.testConstructsWithoutEnvironment / LocalMeterServiceTests.testStatusFields | 一致 | 合格 |
| L-14 | フッター | — | Views/DashboardView.swift | —（目視: TC-01 スクリーンショット） | — | — |

## 業務ルール（B）

| ID | 内容 | ケース | iOS 実装 | 自動テスト | レガシー | iOS E2E |
|---|---|---|---|---|---|---|
| B-01 | 表示名変換 | TC-02, TC-03 | Domain/DisplayNames.swift | DomainTests.testAll18Entries, testPassthrough | 一致 | 合格 |
| B-02 | 7 日未更新判定 | TC-05, TC-06 | Domain/StaleMeterPolicy.swift | DomainTests.testNilIsStale, testRecentIsActive, testExactly7DaysIsStale, testPartitionPreservesOrder | 一致 | 合格 |
| B-03 | 数値表記 | TC-02, TC-03, TC-07 | Domain/NumberFormatting.swift | DomainTests.testJSStrings | 一致 | 合格 |
| B-04 | 期間カットオフ | TC-08, TC-09 | Models/Models.swift, Services/SQLiteStore.swift | DomainTests.testWindows / SQLiteStoreTests.testReadingsCutoffAndAscending / RemoteMeterServiceTests.testHistoryQuery | 一致 | 合格 |
| B-05 | X 軸ラベル書式 | TC-09 | Domain/ChartLabelFormatter.swift | DomainTests.testFormats | 一致 | 合格 |
| B-06 | 30 秒自動更新 | TC-01, TC-19 | Views/DashboardView.swift | —（E2E で確認） | 一致 | 合格 |
| B-07 | Refresh の挙動 | TC-10 | ViewModels/DashboardViewModel.swift, Services/RemoteMeterService.swift | VMTests.testRefreshFailureThenLoadClearsError / RemoteMeterServiceTests.testRefreshIsPost | 一致 | 合格 |
| B-08 | 取得失敗表示 | TC-11 | ViewModels/DashboardViewModel.swift | VMTests.testErrorSetsDisconnectedAndPrefix / RemoteMeterServiceTests.testFastAPIDetailParsing | 一致 | 合格 |
| B-09 | 429 指数バックオフ | TC-12 | Domain/BackoffPolicy.swift, Services/SwitchBotClient.swift | DomainTests.testDelays / ClientTests.test429BacksOffAndSkipsNetwork, testSuccessResetsConsecutiveErrors | 対象外 | 合格 |
| B-10 | バックアップ | TC-13 | Services/SQLiteStore.swift, Services/RemoteMeterService.swift | SQLiteStoreTests.testBackupHasSQLiteHeader / RemoteMeterServiceTests.testExportBackupSanitizesContentDispositionFilename | 一致 | 合格 |
| B-11 | レイテンシ統計 | TC-14 | Services/SQLiteStore.swift | SQLiteStoreTests.testLatencyStatsSeeded, testLatencyStatsEmpty | 一致 | 合格（修正後） |
| B-12 | レイテンシログ | TC-15 | Services/SQLiteStore.swift, Services/RemoteMeterService.swift | SQLiteStoreTests.testLatencyFilterOrderLimit / RemoteMeterServiceTests.testLatencyLogsQueryItems | 一致 | 合格 |
| B-13 | インポート | TC-16 | Services/SQLiteStore.swift, Services/RemoteMeterService.swift | SQLiteStoreTests.testImportSuccess, testImportRollbackOnBadTimestamp / RemoteMeterServiceTests.testImportBodySnakeCase | 一致 | 合格 |
| B-14 | ステータス | TC-17 | Services/LocalMeterService.swift, Models/Models.swift | LocalMeterServiceTests.testStatusFields / JSONCodingTests.testStatusToleratesExtraKeys | 一致 | 合格 |
| B-15 | SwitchBot 署名 | TC-18 | Domain/SwitchBotSigner.swift | DomainTests.testVectorMatchesPythonImplementation, testHeaderKeys | 一致 | 合格（署名が通り 22 呼出 200） |
| B-16 | 対象デバイス種別 | TC-18 | Services/SwitchBotClient.swift | ClientTests.testDeviceTypeFilteringIncludesHub3, testStatusCodeNot100Throws | 一致 | 不一致（Hub 3 追加、仕様どおり） |
| B-17 | 収集処理 | TC-18 | Services/DataCollector.swift | ClientTests.testCollectSavesStatusAndReading, testHumidityNilBecomesZeroInReading, testNoTemperatureNoReading, test429BreaksDeviceLoop, testCollectNoCredsIsNoop / SQLiteStoreTests.testCleanupThresholds | 一致 | 合格（全 21 台に温度） |
| B-18 | 既定の接続先 | TC-20 | Services/AppSettings.swift | —（E2E で確認） | 一致 | 合格 |

## 非機能（V）

| ID | 内容 | ケース | iOS 実装 | 自動テスト | レガシー | iOS E2E |
|---|---|---|---|---|---|---|
| V-01 | 名前のエスケープ（verbatim 表示） | TC-04 | Views/MeterCardView.swift | — | 一致 | 合格 |
| V-02 | ローカライズ en / ja | TC-21 | Resources/Localization/*.lproj, Extensions/String+Localization.swift | UI: testJapaneseLocalization / scripts/check_localization.sh | 対象外 | 合格 |
| V-03 | Keychain 保管 | — | Services/KeychainStore.swift | ClientTests.testMissingCredsThrowsNotConfigured | — | TC-18 で認証情報を Keychain 経由で使用 |
| V-04 | ATS（localhost のみ例外） | — | Info.plist | — | — | TC-20 で HTTPS 本番接続 |
| V-05 | インポート入力検証（部分適用しない） | TC-16 | Services/SQLiteStore.swift, ViewModels/ImportViewModel.swift | SQLiteStoreTests.testImportRollbackOnBadTimestamp / VMTests.testInvalidJSONError | — | 合格 |
