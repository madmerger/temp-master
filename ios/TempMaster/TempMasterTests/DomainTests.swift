import XCTest
@testable import TempMaster

final class SwitchBotSignerTests: XCTestCase {
    func testVectorMatchesPythonImplementation() {
        // Generated with the legacy Python algorithm (HMAC-SHA256(secret,
        // token+t+nonce) -> base64).
        let headers = SwitchBotSigner.headers(
            token: "TESTTOKEN", secret: "TESTSECRET",
            timestampMs: 1700000000000,
            nonce: "00000000-0000-0000-0000-000000000001")
        XCTAssertEqual(headers["sign"], "TE9QKvKIGunbCwcxttQgd9G+I8kKOM6KItiGKfv2Bp0=")
    }

    func testHeaderKeys() {
        let headers = SwitchBotSigner.headers(
            token: "T", secret: "S", timestampMs: 1, nonce: "n")
        XCTAssertEqual(headers["Authorization"], "T")
        XCTAssertEqual(headers["Content-Type"], "application/json")
        XCTAssertEqual(headers["charset"], "utf8")
        XCTAssertEqual(headers["t"], "1")
        XCTAssertEqual(headers["nonce"], "n")
        XCTAssertNotNil(headers["sign"])
    }
}

final class BackoffPolicyTests: XCTestCase {
    func testDelays() {
        XCTAssertEqual(BackoffPolicy.delay(consecutiveErrors: 1), 120)
        XCTAssertEqual(BackoffPolicy.delay(consecutiveErrors: 2), 240)
        XCTAssertEqual(BackoffPolicy.delay(consecutiveErrors: 3), 480)
        XCTAssertEqual(BackoffPolicy.delay(consecutiveErrors: 4), 600)
        XCTAssertEqual(BackoffPolicy.delay(consecutiveErrors: 10), 600)
    }
}

final class TimeScaleTests: XCTestCase {
    func testWindows() {
        XCTAssertEqual(TimeScale.hour.window, 3600)
        XCTAssertEqual(TimeScale.day.window, 86400)
        XCTAssertEqual(TimeScale.week.window, 604800)
        XCTAssertEqual(TimeScale.month.window, 2592000)
        XCTAssertEqual(TimeScale.year.window, 31536000)
    }
}

final class StaleMeterPolicyTests: XCTestCase {
    let now = Date(timeIntervalSince1970: 1_700_000_000)

    func testNilIsStale() {
        XCTAssertTrue(StaleMeterPolicy.isStale(lastUpdated: nil, now: now))
    }

    func testRecentIsActive() {
        let lu = now.addingTimeInterval(-(6 * 86400 + 23 * 3600 + 59 * 60))
        XCTAssertFalse(StaleMeterPolicy.isStale(lastUpdated: lu, now: now))
    }

    func testExactly7DaysIsStale() {
        XCTAssertTrue(StaleMeterPolicy.isStale(
            lastUpdated: now.addingTimeInterval(-7 * 86400), now: now))
    }

    func testPartitionPreservesOrder() {
        func m(_ id: String, _ off: TimeInterval?) -> MeterDevice {
            MeterDevice(deviceID: id, deviceName: id, deviceType: "Meter",
                        lastUpdated: off.map { now.addingTimeInterval($0) })
        }
        let meters = [m("a", -60), m("b", nil), m("c", -8 * 86400), m("d", -1)]
        let (active, stale) = StaleMeterPolicy.partition(meters, now: now)
        XCTAssertEqual(active.map(\.deviceID), ["a", "d"])
        XCTAssertEqual(stale.map(\.deviceID), ["b", "c"])
    }
}

final class ChartLabelFormatterTests: XCTestCase {
    // Fixed UTC date: 2024-01-15 (Mon) 13:45 UTC
    let date = Date(timeIntervalSince1970: 1_705_326_300)
    let utc = TimeZone(secondsFromGMT: 0)!

    func testFormats() {
        XCTAssertEqual(ChartLabelFormatter.label(for: date, scale: .hour, timeZone: utc), "13:45")
        XCTAssertEqual(ChartLabelFormatter.label(for: date, scale: .day, timeZone: utc), "13:45")
        XCTAssertEqual(ChartLabelFormatter.label(for: date, scale: .week, timeZone: utc), "Mon 13")
        XCTAssertEqual(ChartLabelFormatter.label(for: date, scale: .month, timeZone: utc), "Jan 15")
        XCTAssertEqual(ChartLabelFormatter.label(for: date, scale: .year, timeZone: utc), "Jan 15")
    }
}

final class NumberFormattingTests: XCTestCase {
    func testJSStrings() {
        XCTAssertEqual(NumberFormatting.jsString(19.0), "19")
        XCTAssertEqual(NumberFormatting.jsString(22.3), "22.3")
        XCTAssertEqual(NumberFormatting.jsString(-0.5), "-0.5")
        XCTAssertEqual(NumberFormatting.jsString(25.0), "25")
        XCTAssertEqual(NumberFormatting.jsString(0), "0")
    }
}

final class DisplayNamesTests: XCTestCase {
    func testAll18Entries() {
        XCTAssertEqual(DisplayNames.map.count, 18)
        let pairs: [String: String] = [
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
        ]
        for (k, v) in pairs {
            XCTAssertEqual(DisplayNames.displayName(for: k), v, k)
        }
    }

    func testPassthrough() {
        XCTAssertEqual(DisplayNames.displayName(for: "Study Hub"), "Study Hub")
        XCTAssertEqual(DisplayNames.displayName(for: "Tag <b>&</b>"), "Tag <b>&</b>")
    }
}
