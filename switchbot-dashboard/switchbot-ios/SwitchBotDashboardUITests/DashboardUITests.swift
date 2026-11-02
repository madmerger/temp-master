import XCTest

final class DashboardUITests: XCTestCase {
    func testMockDashboardShowsActiveAndStaleMeters() {
        let app = launchMockApp()
        XCTAssertEqual(connectionStatus(in: app).label, "Connected")

        let expectedNames = [
            "C76B0046301A": "第1蒸留塔 (T-101)",
            "D13234351576": "冷却塔 (CT-401)",
            "B0E9FEB9CFA6": "制御盤 (CP-1602)",
            "A1B2C3D4E5F6": "Garage Sensor",
        ]
        for (deviceID, name) in expectedNames {
            XCTAssertTrue(card("MeterCard_\(deviceID)", in: app).exists)
            XCTAssertEqual(app.staticTexts["MeterName_\(deviceID)"].label, name)
        }
        XCTAssertTrue(card("TemperatureChart_C76B0046301A", in: app).exists)

        let staleSection = app.descendants(matching: .any).matching(identifier: "StaleSection").firstMatch
        let scrollView = app.scrollViews.firstMatch
        for _ in 0..<8 where !staleSection.isHittable {
            scrollView.swipeUp()
        }
        XCTAssertTrue(staleSection.waitForExistence(timeout: 5))
        XCTAssertTrue(card("MeterCard_F577B677EC96", in: app).exists)
        XCTAssertTrue(card("MeterCard_000000000000", in: app).exists)
        attachScreenshot("mock-dashboard", from: app)
    }

    func testTimeRangeChangeKeepsConnection() {
        let app = launchMockApp()
        let rangePicker = app.segmentedControls["TimeRangePicker"]
        XCTAssertTrue(rangePicker.waitForExistence(timeout: 5))
        rangePicker.buttons["Last 7 Days"].tap()
        XCTAssertEqual(connectionStatus(in: app).label, "Connected")
        attachScreenshot("week-range", from: app)
    }

    func testAppearanceSelectionPersistsAfterRelaunch() {
        let app = launchMockApp()
        selectAppearance("Light", in: app)
        selectAppearance("Dark", in: app)
        XCTAssertEqual(app.staticTexts["CurrentAppearance"].label, "Dark")
        attachScreenshot("theme-toggled", from: app)

        app.terminate()
        app.launch()
        XCTAssertEqual(app.staticTexts["CurrentAppearance"].label, "Dark")
        XCTAssertEqual(connectionStatus(in: app).label, "Connected")
        attachScreenshot("theme-restored", from: app)
    }

    private func launchMockApp() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-UITestMockData"]
        app.launch()
        XCTAssertTrue(connectionStatus(in: app).waitForExistence(timeout: 10))
        return app
    }

    private func connectionStatus(in app: XCUIApplication) -> XCUIElement {
        app.staticTexts["ConnectionStatus"]
    }

    private func card(_ identifier: String, in app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func selectAppearance(_ value: String, in app: XCUIApplication) {
        let picker = app.buttons["AppearancePicker"]
        XCTAssertTrue(picker.waitForExistence(timeout: 5))
        picker.tap()
        let button = app.buttons[value]
        let menuItem = app.menuItems[value]
        if button.exists {
            button.tap()
        } else {
            XCTAssertTrue(menuItem.waitForExistence(timeout: 5))
            menuItem.tap()
        }
        XCTAssertEqual(app.staticTexts["CurrentAppearance"].label, value)
    }

    private func attachScreenshot(_ name: String, from app: XCUIApplication) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
