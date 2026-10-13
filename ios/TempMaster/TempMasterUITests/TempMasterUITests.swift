import XCTest

final class TempMasterUITests: XCTestCase {
    private func launch(_ extraArguments: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-UITestMockData"] + extraArguments
        app.launch()
        return app
    }

    func testDashboardShowsMappedAndLiteralDeviceNames() {
        let app = launch()
        XCTAssertTrue(app.navigationBars["Temp Master Dashboard"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Connected"].exists)
        XCTAssertTrue(app.staticTexts["Monitoring 6 meters"].exists)
        XCTAssertTrue(app.staticTexts["第1蒸留塔 (T-101)"].exists)
        app.swipeUp()
        XCTAssertTrue(app.staticTexts["Tag <b>&</b>"].waitForExistence(timeout: 5))
    }

    func testTimeRangePickerFiltersHistory() {
        let app = launch()
        let chart = app.descendants(matching: .any)["meterChart_SEED-D1"]
        XCTAssertTrue(chart.waitForExistence(timeout: 10))
        app.buttons["timeRangePicker"].tap()
        XCTAssertTrue(app.buttons["Last Hour"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["Last 24 Hours"].exists)
        XCTAssertTrue(app.buttons["Last 7 Days"].exists)
        XCTAssertTrue(app.buttons["Last 30 Days"].exists)
        XCTAssertTrue(app.buttons["Last Year"].exists)
        app.buttons["Last Hour"].tap()
        XCTAssertTrue(eventuallyValue(chart, "1 points"))
        app.buttons["timeRangePicker"].tap()
        app.buttons["Last Year"].tap()
        XCTAssertTrue(eventuallyValue(chart, "5 points"))
    }

    func testStaleSectionAndNoHistoryBadges() {
        let app = launch(["-UITestScrollToStale"])
        XCTAssertTrue(app.staticTexts["冷却塔 (CT-401)"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["コンプレッサー (C-601)"].exists)
        XCTAssertTrue(app.staticTexts["7日以上未更新"].exists)
        XCTAssertTrue(app.staticTexts["履歴データの取得対象外"].exists)
        XCTAssertTrue(app.staticTexts["値がありません（データ未受信）"].exists)
    }

    func testRateLimitBanner() {
        let app = launch(["-UITestRateLimited"])
        XCTAssertTrue(app.staticTexts["SwitchBot API rate limit reached. Retry in 120 seconds."].waitForExistence(timeout: 10))
        XCTAssertTrue(app.descendants(matching: .any)["rateLimitWarning"].exists)
    }

    func testNavigationAndSettingsContainNoServiceName() {
        let app = launch()
        app.tabBars.buttons["Latency"].tap()
        XCTAssertTrue(app.staticTexts["latencyStats_total"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["4"].exists)
        app.tabBars.buttons["Import"].tap()
        XCTAssertTrue(app.buttons["Choose JSON File"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Settings"].tap()
        let mockModeRow = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", "Mock (UI Test)")).firstMatch
        XCTAssertTrue(mockModeRow.waitForExistence(timeout: 5))
        let labels = app.descendants(matching: .any).allElementsBoundByIndex.map(\.label)
        XCTAssertFalse(labels.contains { $0.localizedCaseInsensitiveContains("snake") })
    }

    func testImportPastedJSON() {
        let app = launch()
        app.tabBars.buttons["Import"].tap()
        let editor = app.textViews["importJSONEditor"]
        XCTAssertTrue(editor.waitForExistence(timeout: 5))
        editor.tap()
        editor.typeText(#"{"devices":[{"device_id":"ui-import","device_name":"Imported","device_type":"Meter","readings":[]}]}"#)
        app.buttons["Import Pasted JSON"].tap()
        XCTAssertTrue(app.staticTexts["Imported devices: 1, readings: 0"].waitForExistence(timeout: 10))
    }

    func testJapaneseLocalization() {
        let app = XCUIApplication()
        app.launchArguments = ["-UITestMockData", "-UITestScrollToStale", "-AppleLanguages", "(ja)", "-AppleLocale", "ja_JP"]
        app.launch()
        XCTAssertTrue(app.buttons["データ更新"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["未更新のメーター"].waitForExistence(timeout: 10))
    }

    func testBackupErrorShowsRequestIDAndDisconnected() {
        let app = launch(["-UITestBackupError"])
        app.buttons["backupButton"].tap()
        XCTAssertTrue(app.staticTexts["Failed to download backup (HTTP 500). Request ID: 0123456789ab"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Disconnected"].exists)
    }

    private func eventuallyValue(_ element: XCUIElement, _ expected: String, timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "value == %@", expected)
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        return XCTWaiter.wait(for: [expectation], timeout: timeout) == .completed
    }
}
