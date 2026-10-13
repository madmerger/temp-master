import XCTest
@testable import TempMaster

final class DomainTests: XCTestCase {
    func testTimeScaleCutoffsAndHistoryFiltering() async throws {
        XCTAssertEqual(TimeScale.hour.cutoffSeconds, 3_600)
        XCTAssertEqual(TimeScale.day.cutoffSeconds, 86_400)
        XCTAssertEqual(TimeScale.week.cutoffSeconds, 604_800)
        XCTAssertEqual(TimeScale.month.cutoffSeconds, 2_592_000)
        XCTAssertEqual(TimeScale.year.cutoffSeconds, 31_536_000)

        let now = Date(timeIntervalSince1970: 1_800_000_000)
        let service = MockMeterService(arguments: ["-UITestMockData"], now: now)
        let hour = try await service.fetchHistory(deviceId: "SEED-D1", timeScale: .hour)
        let day = try await service.fetchHistory(deviceId: "SEED-D1", timeScale: .day)
        let week = try await service.fetchHistory(deviceId: "SEED-D1", timeScale: .week)
        let month = try await service.fetchHistory(deviceId: "SEED-D1", timeScale: .month)
        let year = try await service.fetchHistory(deviceId: "SEED-D1", timeScale: .year)
        XCTAssertEqual(hour.history.count, 1)
        XCTAssertEqual(day.history.count, 2)
        XCTAssertEqual(week.history.count, 3)
        XCTAssertEqual(month.history.count, 4)
        XCTAssertEqual(year.history.count, 5)
    }

    func testMockLatencyFixturesProduceExpectedStatistics() async throws {
        let service = MockMeterService(arguments: ["-UITestMockData"], now: Date(timeIntervalSince1970: 1_800_000_000))
        let stats = try await service.fetchLatencyStats(start: nil, end: nil)
        XCTAssertEqual(stats.totalCalls, 4)
        XCTAssertEqual(stats.avgLatencyMs, 137.625)
        XCTAssertEqual(stats.minLatencyMs, 50)
        XCTAssertEqual(stats.maxLatencyMs, 300)
        XCTAssertEqual(stats.successfulCalls, 2)
        XCTAssertEqual(stats.failedCalls, 2)
        XCTAssertEqual(stats.successRate, 50)
    }

    func testStaleRulesIncludeInvalidAndSevenDayBoundary() {
        let now = Date(timeIntervalSince1970: 1_800_000_000)
        XCTAssertTrue(MeterRules.isStale(lastUpdated: nil, now: now))
        XCTAssertTrue(MeterRules.isStale(lastUpdatedRaw: "not-a-date", now: now))
        XCTAssertTrue(MeterRules.isStale(lastUpdated: now.addingTimeInterval(-7 * 86_400), now: now))
        XCTAssertFalse(MeterRules.isStale(lastUpdated: now.addingTimeInterval(-7 * 86_400 + 1), now: now))
    }

    func testInvalidLastUpdatedDisplayUsesLegacyInvalidDateValue() {
        XCTAssertEqual(MeterRules.lastUpdatedDisplayValue(raw: "not-a-date"), "Invalid Date")
    }

    func testChartLabelsAndEightLabelLimit() {
        let date = ISO8601Parsing.parse("2024-01-02T03:04:00Z")!
        let zone = TimeZone(secondsFromGMT: -8 * 3_600)!
        XCTAssertEqual(MeterRules.formatLabel(date, scale: .hour, timeZone: zone), "19:04")
        XCTAssertEqual(MeterRules.formatLabel(date, scale: .day, timeZone: zone), "19:04")
        XCTAssertEqual(MeterRules.formatLabel(date, scale: .week, timeZone: zone), "Mon 19")
        XCTAssertEqual(MeterRules.formatLabel(date, scale: .month, timeZone: zone), "Jan 1")
        XCTAssertEqual(MeterRules.labelIndices(count: 100).count, 8)
        XCTAssertEqual(MeterRules.labelIndices(count: 3), [0, 1, 2])
    }

    func testDisplayNamesAndUnknownPassthrough() {
        let expected: [String: String] = [
            "Bedroom Meter": "第1蒸留塔 (T-101)",
            "Living Meter": "第2蒸留塔 (T-102)",
            "2世": "反応器 (R-201)",
            "夢男": "熱交換器 (E-301)",
            "夢": "熱交換器 (E-302)",
            "アワコ": "冷却塔 (CT-401)",
            "ジャガ百万石": "加熱炉 (H-501)",
            "ネズミ": "コンプレッサー (C-601)",
            "バロン": "遠心分離機 (S-701)",
            "ゴンタ": "混合槽 (M-801)",
            "蛇棚": "貯蔵タンク (TK-901)",
            "中華棚": "貯蔵タンク (TK-902)",
            "へておケージ": "配管ライン (PL-1001)",
            "外": "屋外モニター (EM-1101)",
            "インキュベーター": "乾燥機 (D-1201)",
            "ビアク": "吸収塔 (A-1301)",
            "ブロッチ Hot Spot": "フレアスタック (FS-1401)",
            "マダラアオジタ": "ボイラー (B-1501)",
            "Study Hub": "制御盤 (CP-1601)",
            "Livingroom Hub": "制御盤 (CP-1602)",
            "Bedroom Hub": "制御盤 (CP-1603)",
            "ガー子ケージ": "配管ライン (PL-1002)",
            "極道": "粉砕機 (G-1701)"
        ]
        XCTAssertEqual(DisplayNames.values.count, 23)
        for (source, localized) in expected {
            XCTAssertEqual(DisplayNames.displayName(for: source), localized)
        }
        XCTAssertEqual(DisplayNames.displayName(for: "Unmapped <b>&</b>"), "Unmapped <b>&</b>")
    }

    func testJavaScriptCompatibleNumberFormatting() {
        XCTAssertEqual(MeterRules.numberString(19.0), "19")
        XCTAssertEqual(MeterRules.numberString(22.3), "22.3")
        XCTAssertEqual(MeterRules.numberString(100), "100")
        XCTAssertEqual(MeterRules.numberString(137.625), "137.625")
        XCTAssertEqual(MeterRules.numberString(-0.5), "-0.5")
    }
}
