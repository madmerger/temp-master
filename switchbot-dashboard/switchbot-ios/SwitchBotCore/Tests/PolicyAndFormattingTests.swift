import XCTest
@testable import SwitchBotCore

final class PolicyAndFormattingTests: XCTestCase {
    func testStaleThresholdBoundaries() {
        let now = Date(timeIntervalSince1970: 1_800_000_000)
        XCTAssertTrue(StaleMeterPolicy.isStale(lastUpdated: nil, now: now))
        XCTAssertTrue(
            StaleMeterPolicy.isStale(
                lastUpdated: now.addingTimeInterval(-StaleMeterPolicy.threshold),
                now: now
            )
        )
        XCTAssertFalse(
            StaleMeterPolicy.isStale(
                lastUpdated: now.addingTimeInterval(-StaleMeterPolicy.threshold + 1),
                now: now
            )
        )
    }

    func testChartLabelsUseTheProvidedTimeZoneAndLegacyFormats() throws {
        let timeZone = try XCTUnwrap(TimeZone(secondsFromGMT: 0))
        let date = try XCTUnwrap(ISO8601DateFormatter().date(from: "2026-11-02T09:07:00Z"))
        XCTAssertEqual(ChartLabelFormatter.format(date, timeScale: .hour, timeZone: timeZone), "09:07")
        XCTAssertEqual(ChartLabelFormatter.format(date, timeScale: .day, timeZone: timeZone), "09:07")
        XCTAssertEqual(ChartLabelFormatter.format(date, timeScale: .week, timeZone: timeZone), "Mon 09")
        XCTAssertEqual(ChartLabelFormatter.format(date, timeScale: .month, timeZone: timeZone), "Nov 2")
        XCTAssertEqual(ChartLabelFormatter.format(date, timeScale: .year, timeZone: timeZone), "Nov 2")
    }

    func testTimeScaleLabels() {
        XCTAssertEqual(TimeScale.allCases.map(\.displayLabel), [
            "Last Hour",
            "Last 24 Hours",
            "Last 7 Days",
            "Last 30 Days",
            "Last Year",
        ])
    }
}
