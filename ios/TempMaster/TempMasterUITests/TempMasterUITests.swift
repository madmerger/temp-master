import XCTest

final class TempMasterUITests: XCTestCase {
    private func launch(_ extraArgs: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-UITestMockData"] + extraArgs
        app.launch()
        return app
    }

    func testDashboardShowsTitleConnectionAndCount() {
        let app = launch()
        XCTAssertTrue(app.navigationBars["Temp Master Dashboard"]
            .waitForExistence(timeout: 10))
        let status = app.staticTexts["status-meters-count"]
        XCTAssertTrue(status.waitForExistence(timeout: 10))
        XCTAssertEqual(status.label, "Monitoring 6 meters")
    }

    func testMeterCardLabelsAndDisplayName() {
        let app = launch()
        let card = app.otherElements["meter-card-SEED-D1"]
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        XCTAssertTrue(card.staticTexts["第1蒸留塔 (T-101)"].exists)
        XCTAssertTrue(card.staticTexts["22.3°C"].exists)
        XCTAssertTrue(card.staticTexts["80%"].exists)
        XCTAssertTrue(card.staticTexts["20%"].exists)
    }

    func testStaleSectionShowsTwoCardsAndBadge() {
        let app = launch()
        XCTAssertTrue(app.otherElements["meter-card-SEED-D1"]
            .waitForExistence(timeout: 10))
        // The stale section is below the fold — scroll until it is created.
        let stale = app.otherElements["stale-section"]
        for _ in 0..<10 where !stale.exists {
            app.swipeUp()
        }
        XCTAssertTrue(stale.waitForExistence(timeout: 5))
        for _ in 0..<10 where !app.otherElements["meter-card-SEED-D4"].exists {
            app.swipeUp()
        }
        XCTAssertTrue(app.otherElements["meter-card-SEED-D4"].exists)
        XCTAssertTrue(app.otherElements["meter-card-SEED-D5"].exists)
        XCTAssertTrue(app.staticTexts["7日以上未更新"].exists)
    }

    func testTimeRangeHourShowsOnePoint() {
        let app = launch()
        XCTAssertTrue(app.otherElements["chart-SEED-D1"]
            .waitForExistence(timeout: 10))
        app.buttons["time-scale-picker"].tap()
        XCTAssertTrue(app.buttons["Last Hour"].waitForExistence(timeout: 5))
        app.buttons["Last Hour"].tap()
        let chart = app.otherElements["chart-SEED-D1"]
        XCTAssertTrue(chart.waitForExistence(timeout: 10))
        let deadline = Date().addingTimeInterval(10)
        var matched = chart.value as? String
        while Date() < deadline, matched != "1 point" {
            matched = chart.value as? String
            usleep(200_000)
        }
        XCTAssertEqual(matched, "1 point")
    }

    func testRateLimitWarning() {
        let app = launch(["-MockRateLimited"])
        XCTAssertTrue(app.descendants(matching: .any)["rate-limit-warning"]
            .waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(
            format: "label CONTAINS %@",
            "SwitchBot API rate limit reached. Retry in 120 seconds."))
            .firstMatch.exists)
    }

    func testTabsNavigate() {
        let app = launch()
        app.tabBars.buttons["Latency"].tap()
        XCTAssertTrue(app.navigationBars["Latency"].exists)
        app.tabBars.buttons["Import"].tap()
        XCTAssertTrue(app.navigationBars["Import"].exists)
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.navigationBars["Settings"].exists)
    }

    func testJapaneseLocalization() {
        let app = launch(["-AppleLanguages", "(ja)"])
        XCTAssertTrue(app.navigationBars["Temp Master Dashboard"]
            .waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["btn-refresh"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.buttons["btn-refresh"].label, "データ更新")
        for _ in 0..<10 where !app.staticTexts["未更新のメーター"].exists {
            app.swipeUp()
        }
        XCTAssertTrue(app.staticTexts["未更新のメーター"].exists)
    }
}
