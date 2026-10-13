import XCTest

/// End-to-end UI measurements against the actual local legacy backend.
/// The host compares observations to the frozen spec and stops on the first FAIL.
final class TempMasterE2ETests: XCTestCase {
    private let app = XCUIApplication()
    private let host = "http://127.0.0.1:8898"
    private enum E2EError: Error { case failed(String) }

    override func setUp() { continueAfterFailure = false }

    @discardableResult
    private func request(_ path: String, _ payload: [String: Any]? = nil) throws -> Any {
        var req = URLRequest(url: URL(string: host + path)!)
        req.timeoutInterval = 180
        if let payload {
            req.httpMethod = "POST"
            req.httpBody = try JSONSerialization.data(withJSONObject: payload)
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        let done = expectation(description: path)
        var response: Data?
        var failure: Error?
        URLSession.shared.dataTask(with: req) { data, _, error in
            response = data
            failure = error
            done.fulfill()
        }.resume()
        wait(for: [done], timeout: 185)
        if let failure { throw failure }
        return try JSONSerialization.jsonObject(with: response ?? Data())
    }

    private func el(_ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    private func label(_ id: String) -> String { el(id).exists ? el(id).label : "" }
    private func value(_ id: String) -> String { (el(id).value as? String) ?? "" }

    private func awaitLabel(_ id: String, _ text: String, timeout: TimeInterval = 15) -> Bool {
        let pred = NSPredicate { _, _ in self.label(id) == text }
        return XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: pred, object: nil)], timeout: timeout) == .completed
    }

    private func launch(_ extras: [String] = [], mock: Bool = false, locale: String = "en") {
        app.terminate()
        app.launchArguments = ["-AppleLanguages", "(\(locale))", "-AppleLocale", locale == "ja" ? "ja_JP" : "en_US"]
        app.launchArguments += mock ? ["-UITestMockData"] :
            ["-dataSource", "remote", "-usesCustomBackend", "YES", "-customBackendURL", host]
        app.launchArguments += extras
        app.launch()
    }

    private func visible(_ element: XCUIElement) {
        for _ in 0..<12 {
            if element.exists && element.isHittable { return }
            app.swipeUp()
        }
    }

    private func top() {
        for _ in 0..<12 {
            if el("refreshButton").isHittable { return }
            app.swipeDown()
        }
    }

    private func tab(_ name: String) { app.tabBars.buttons[name].tap() }

    private func record(_ id: String, _ actual: [String: Any], notes: [String] = []) throws {
        let result = try request("/record", [
            "id": id, "actual": actual, "notes": notes,
            "screen": app.screenshot().pngRepresentation.base64EncodedString()
        ]) as! [String: Any]
        if result["overall"] as? String == "FAIL" { throw E2EError.failed(id) }
    }

    private func card(_ did: String, chart: Bool = true) -> [String: Any] {
        visible(el("meterName_\(did)"))
        let labels = ["meterTemp_", "meterHumidity_", "meterBattery_"].compactMap { prefix -> String? in
            let element = el(prefix + did)
            return element.exists ? element.label : nil
        }
        return ["display_name": label("meterName_\(did)"), "device_type": label("meterType_\(did)"),
                "labels": labels, "has_chart": el("meterChart_\(did)").exists,
                "last_updated_prefix": label("meterLastUpdated_\(did)").hasPrefix("Last updated: ") ? "Last updated: " : "",
                "has_last_updated": el("meterLastUpdated_\(did)").exists]
    }

    private func latest(_ path: String) throws -> [String: Any] {
        let trace = try request("/trace") as! [[String: Any]]
        return trace.last(where: { $0["path"] as? String == path }) ?? [:]
    }

    func test01RemoteCases() throws {
        try request("/reset", [:])
        try request("/upstream", ["url": "http://127.0.0.1:8000"])
        launch()
        XCTAssertTrue(awaitLabel("statusMetersCount", "Monitoring 6 meters"))
        try record("TC-01", [
            "title": app.navigationBars.firstMatch.identifier,
            "connection": label("connectionStatus"), "status_text": label("statusMetersCount"),
            "last_refresh_regex": label("statusLastRefresh"),
            "rate_limit_warning_visible": el("rateLimitWarning").exists,
            "error_visible": el("errorText").exists
        ])
        var activeIDs: Set<String> = []
        let d1 = card("SEED-D1")
        if d1["has_chart"] as? Bool == true { activeIDs.insert("SEED-D1") }
        try record("TC-02", d1)
        let d2 = card("SEED-D2")
        if d2["has_chart"] as? Bool == true { activeIDs.insert("SEED-D2") }
        let d3 = card("SEED-D3")
        if d3["has_chart"] as? Bool == true { activeIDs.insert("SEED-D3") }
        try record("TC-03", d3)
        let d6 = card("SEED-D6")
        if d6["has_chart"] as? Bool == true { activeIDs.insert("SEED-D6") }
        try record("TC-04", d6)
        visible(app.staticTexts["未更新のメーター"])
        visible(el("meterName_SEED-D5"))
        try record("TC-05", [
            "section_title": app.staticTexts["未更新のメーター"].label,
            "section_subtitle": app.staticTexts["1週間以上更新されていないデバイス"].label,
            "stale_display_names": [label("meterName_SEED-D4"),label("meterName_SEED-D5")],
            "badge": label("staleBadge_SEED-D4"), "no_history_text": label("staleNoHistory_SEED-D4"),
            "active_count": activeIDs.count
        ])
        var d5 = card("SEED-D5")
        d5["no_value_text"] = label("staleNoValue_SEED-D5")
        try record("TC-06", d5)
        try record("TC-07", card("SEED-D4"))
        top()
        let initial = label("timeRangePicker")
        el("timeRangePicker").tap()
        let options = ["Last Hour", "Last 24 Hours", "Last 7 Days", "Last 30 Days", "Last Year"]
        try record("TC-08", ["options": options.filter { app.buttons[$0].exists },
                              "default": initial.contains("Last 24 Hours") ? "Last 24 Hours" : initial])
        app.buttons["Last Hour"].tap()
        var points: [String: Int] = [:]
        for (index, scale) in ["hour","day","week","month","year"].enumerated() {
            if index > 0 {
                el("timeRangePicker").tap()
                app.buttons[options[index]].tap()
            }
            let expectedValue = "\(index+1) points"
            let pred = NSPredicate { _, _ in self.value("meterChart_SEED-D1") == expectedValue }
            _ = XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: pred, object: nil)], timeout: 10)
            points[scale] = Int(value("meterChart_SEED-D1").components(separatedBy: " ").first ?? "")
            // Capture each actual chart for visual X-axis verification.
            try request("/screen", ["name": "TC-09_\(scale)",
                                   "screen": app.screenshot().pngRepresentation.base64EncodedString()])
        }
        try record("TC-09", ["points": points],
                   notes: ["X軸ラベルはアクセシビリティ対象外のため期間別画像による視覚確認が必要"])
        el("refreshButton").tap()
        let during = label("refreshButton")
        XCTAssertTrue(awaitLabel("refreshButton", "Refresh Data"))
        try record("TC-10", ["refresh_http_status": try latest("/api/meters/refresh")["status"] ?? NSNull(),
                              "button_during": during, "final_button": label("refreshButton"),
                              "final_connection": label("connectionStatus"),
                              "final_error_visible": el("errorText").exists])
        el("backupButton").tap()
        let downloading = label("backupButton")
        XCTAssertTrue(app.buttons["Close"].waitForExistence(timeout: 15) || app.otherElements["ActivityListView"].exists)
        var backup = try request("/backup-info") as! [String: Any]
        backup["button_during"] = downloading
        backup["final_button"] = label("backupButton")
        backup["http_status"] = try latest("/api/backup")["status"] ?? NSNull()
        backup["error_visible"] = el("errorText").exists
        try record("TC-13", backup)
        if app.buttons["Close"].exists { app.buttons["Close"].tap() }
        tab("Latency")
        XCTAssertTrue(el("latencyStats_total").waitForExistence(timeout: 10))
        func number(_ id: String) -> Double? {
            let text = el(id).staticTexts.allElementsBoundByIndex.last?.label ?? label(id)
            let pattern = "[0-9]+(?:\\.[0-9]+)?"
            guard let range = text.range(of: pattern, options: .regularExpression) else { return nil }
            return Double(text[range])
        }
        try record("TC-14", ["total_calls": number("latencyStats_total") as Any,
                              "avg_latency_ms": number("latencyStats_avg") as Any,
                              "min_latency_ms": number("latencyStats_min") as Any,
                              "max_latency_ms": number("latencyStats_max") as Any,
                              "successful_calls": number("latencyStats_success") as Any,
                              "failed_calls": number("latencyStats_failed") as Any,
                              "success_rate": number("latencyStats_rate") as Any])
        var endpoints: [String] = []
        for index in 0..<4 {
            let row = el("latencyLogRow_\(index)")
            visible(row)
            endpoints.append(row.staticTexts.firstMatch.label)
        }
        func field(_ id: String, _ text: String) {
            let f = el(id)
            for _ in 0..<8 {
                if f.isHittable { break }
                app.swipeDown()
            }
            f.tap()
            if let current = f.value as? String, current != "" && current != f.placeholderValue {
                f.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: current.count))
            }
            f.typeText(text)
            app.navigationBars.firstMatch.tap()
        }
        func applyCount() -> Int {
            visible(el("latencyApplyButton"))
            el("latencyApplyButton").tap()
            Thread.sleep(forTimeInterval: 1)
            return Int(label("latencyLogCount").filter(\.isNumber)) ?? -1
        }
        field("latencyFilterEndpoint", "/devices")
        let endpointCount = applyCount()
        field("latencyFilterEndpoint", "")
        field("latencyFilterDevice", "SEED-D1")
        let deviceCount = applyCount()
        field("latencyFilterDevice", "")
        field("latencyFilterLimit", "2")
        let limitCount = applyCount()
        try record("TC-15", ["order_endpoints": endpoints, "filter_endpoint_count": endpointCount,
                              "filter_device_count": deviceCount, "limit2_count": limitCount])
        launch(["-UITestInitialTab", "settings"])
        el("testConnectionButton").tap()
        XCTAssertTrue(awaitLabel("connectionTestResult", "OK (status: ok)"))
        visible(el("settingsStatus_collectionInterval"))
        try record("TC-17", ["healthz": label("connectionTestResult").contains("status: ok") ? "ok" : "",
                              "configured": label("settingsStatus_configured").contains("true"),
                              "meters_count": Int(label("settingsStatus_metersCount").filter(\.isNumber)) ?? -1,
                              "is_rate_limited": label("settingsStatus_rateLimited").contains("true"),
                              "collection_interval": Int(label("settingsStatus_collectionInterval").filter(\.isNumber)) ?? -1])
        tab("Dashboard")
        top()
        let before = label("statusLastRefresh")
        Thread.sleep(forTimeInterval: 35)
        let after = label("statusLastRefresh")
        try record("TC-19", ["last_refresh_changed": before != after, "before": before, "after": after])
        tab("Import")
        let payload = try request("/extra")
        let json = String(data: try JSONSerialization.data(withJSONObject: payload), encoding: .utf8)!
        el("importJSONEditor").tap()
        el("importJSONEditor").typeText(json)
        app.navigationBars.firstMatch.tap()
        visible(el("importPasteButton"))
        el("importPasteButton").tap()
        XCTAssertTrue(awaitLabel("importResult", "Imported devices: 1, readings: 2"))
        let importResult = label("importResult")
        try request("/screen", ["name": "TC-16_import",
                               "screen": app.screenshot().pngRepresentation.base64EncodedString()])
        launch()
        XCTAssertTrue(awaitLabel("statusMetersCount", "Monitoring 7 meters"))
        visible(el("meterName_SEED-D7"))
        try record("TC-16", ["imported_devices": importResult.contains("devices: 1") ? 1 : -1,
                              "imported_readings": importResult.contains("readings: 2") ? 2 : -1,
                              "new_display_name": label("meterName_SEED-D7"),
                              "status_text": label("statusMetersCount"),
                              "seed_d7_is_stale": el("staleBadge_SEED-D7").exists])
        top()
        try request("/stop-backend", [:])
        el("refreshButton").tap()
        XCTAssertTrue(awaitLabel("connectionStatus", "Disconnected"))
        try record("TC-11", ["connection": label("connectionStatus"), "error_prefix": label("errorText")])
        try request("/reset", [:])
        try request("/upstream", ["url": "http://127.0.0.1:8002"])
        launch()
        XCTAssertTrue(awaitLabel("statusMetersCount", "Monitoring 6 meters"))
        el("backupButton").tap()
        XCTAssertTrue(awaitLabel("connectionStatus", "Disconnected"))
        let trace = try latest("/api/backup")
        let body = trace["body"] as? [String: Any] ?? [:]
        let headers = trace["headers"] as? [String: String] ?? [:]
        try record("TC-22", ["http_status": trace["status"] ?? NSNull(),
                              "body_request_id_regex": body["request_id"] ?? NSNull(),
                              "x_request_id_matches_body": headers["x-request-id"] == body["request_id"] as? String,
                              "error_regex": label("errorText"), "connection": label("connectionStatus"),
                              "final_button": label("backupButton")])
    }

    /// Resume after the measured dashboard/latency cases without repeating them.
    func test01bRemainingRemoteCases() throws {
        try request("/upstream", ["url": "http://127.0.0.1:8000"])
        launch(["-UITestInitialTab", "settings"])
        XCTAssertTrue(el("testConnectionButton").waitForExistence(timeout: 10))
        el("testConnectionButton").tap()
        XCTAssertTrue(awaitLabel("connectionTestResult", "OK (status: ok)"))
        visible(el("settingsStatus_collectionInterval"))
        try record("TC-17", ["healthz": label("connectionTestResult").contains("status: ok") ? "ok" : "",
                              "configured": label("settingsStatus_configured").contains("true"),
                              "meters_count": Int(label("settingsStatus_metersCount").filter(\.isNumber)) ?? -1,
                              "is_rate_limited": label("settingsStatus_rateLimited").contains("true"),
                              "collection_interval": Int(label("settingsStatus_collectionInterval").filter(\.isNumber)) ?? -1])
        tab("Dashboard")
        XCTAssertTrue(awaitLabel("statusMetersCount", "Monitoring 6 meters"))
        let before = label("statusLastRefresh")
        Thread.sleep(forTimeInterval: 35)
        let after = label("statusLastRefresh")
        try record("TC-19", ["last_refresh_changed": before != after, "before": before, "after": after])
        tab("Import")
        let payload = try request("/extra")
        let json = String(data: try JSONSerialization.data(withJSONObject: payload), encoding: .utf8)!
        el("importJSONEditor").tap()
        el("importJSONEditor").typeText(json)
        visible(el("importPasteButton"))
        el("importPasteButton").tap()
        XCTAssertTrue(awaitLabel("importResult", "Imported devices: 1, readings: 2"))
        let importResult = label("importResult")
        try request("/screen", ["name": "TC-16_import",
                               "screen": app.screenshot().pngRepresentation.base64EncodedString()])
        launch()
        XCTAssertTrue(awaitLabel("statusMetersCount", "Monitoring 7 meters"))
        let count = label("statusMetersCount")
        visible(el("meterName_SEED-D7"))
        try record("TC-16", ["imported_devices": importResult.contains("devices: 1") ? 1 : -1,
                              "imported_readings": importResult.contains("readings: 2") ? 2 : -1,
                              "new_display_name": label("meterName_SEED-D7"), "status_text": count,
                              "seed_d7_is_stale": el("staleBadge_SEED-D7").exists])
        top()
        try request("/stop-backend", [:])
        el("refreshButton").tap()
        XCTAssertTrue(awaitLabel("connectionStatus", "Disconnected"))
        try record("TC-11", ["connection": label("connectionStatus"), "error_prefix": label("errorText")])
        try request("/reset", [:])
        try request("/upstream", ["url": "http://127.0.0.1:8002"])
        launch()
        XCTAssertTrue(awaitLabel("statusMetersCount", "Monitoring 6 meters"))
        el("backupButton").tap()
        XCTAssertTrue(awaitLabel("connectionStatus", "Disconnected"))
        let trace = try latest("/api/backup")
        let body = trace["body"] as? [String: Any] ?? [:]
        let headers = trace["headers"] as? [String: String] ?? [:]
        try record("TC-22", ["http_status": trace["status"] ?? NSNull(),
                              "body_request_id_regex": body["request_id"] ?? NSNull(),
                              "x_request_id_matches_body": headers["x-request-id"] == body["request_id"] as? String,
                              "error_regex": label("errorText"), "connection": label("connectionStatus"),
                              "final_button": label("backupButton")])
    }

    func test02MockCases() throws {
        launch(["-UITestRateLimited"], mock: true)
        XCTAssertTrue(el("rateLimitWarning").waitForExistence(timeout: 10))
        try record("TC-12", ["warning_title": app.staticTexts["Rate Limited."].exists ? "Rate Limited." : "",
                              "warning_text": app.staticTexts["SwitchBot API rate limit reached. Retry in 120 seconds."].label])
        launch(mock: true, locale: "ja")
        XCTAssertTrue(el("refreshButton").waitForExistence(timeout: 10))
        let refresh = label("refreshButton")
        visible(app.staticTexts["未更新のメーター"])
        try record("TC-21", ["refresh_button": refresh, "stale_section_title": app.staticTexts["未更新のメーター"].label])
    }

    func test03ProductionReadOnly() throws {
        let before = try request("/production", [:]) as! [String: Any]
        launch(["-UITestInitialTab", "settings"])
        el("backendPicker").tap()
        app.buttons["Production"].tap()
        tab("Dashboard")
        XCTAssertTrue(el("statusMetersCount").waitForExistence(timeout: 30))
        let after = try request("/production", [:]) as! [String: Any]
        let status = label("statusMetersCount")
        XCTAssertEqual(status, "Monitoring \(before["meters_count"]!) meters")
        XCTAssertEqual(status, "Monitoring \(after["meters_count"]!) meters")
        try record("TC-20", ["status_text": status, "connection": label("connectionStatus"),
                             "production_before": before, "production_after": after],
                   notes: ["ProductionをSettingsで選択。GETのみ。Refresh/Import未実行"])
    }

    /// No proxy-generated error: exercise the app's actual URLSession refusal.
    func test01cDirectDisconnect() throws {
        try request("/reset", [:])
        defer { try? request("/reset", [:]) }
        launch(["-customBackendURL", "http://127.0.0.1:8000"])
        XCTAssertTrue(awaitLabel("statusMetersCount", "Monitoring 6 meters"))
        try request("/stop-backend", [:])
        el("refreshButton").tap()
        XCTAssertTrue(awaitLabel("connectionStatus", "Disconnected"))
        try record("TC-11", ["connection": label("connectionStatus"), "error_prefix": label("errorText")],
                   notes: ["127.0.0.1:8000へ直接接続してバックエンドを停止。proxy生成502ではなく実URLSession接続失敗を確認。"])
    }
}
