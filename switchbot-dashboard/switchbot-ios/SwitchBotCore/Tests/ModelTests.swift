import XCTest
@testable import SwitchBotCore

final class ModelTests: XCTestCase {
    func testDecodesFractionalOffsetAndNaiveDatesAsUTC() throws {
        let variants = [
            "2026-02-09T02:13:39.882908+00:00",
            "2026-02-09T02:13:39+00:00",
            "2026-02-09T02:13:39Z",
            "2026-02-09T02:13:39.882908",
        ]
        for value in variants {
            let data = Data(
                """
                {
                  "device_id": "meter",
                  "device_name": "Bedroom Meter",
                  "device_type": "Meter",
                  "last_updated": "\(value)"
                }
                """.utf8
            )
            let meter = try DashboardJSON.decoder().decode(Meter.self, from: data)
            let expectedString = value.range(of: #"\.\d+"#, options: .regularExpression) == nil
                ? value
                : value
            let normalized = expectedString.hasSuffix("Z")
                || expectedString.range(of: #"[+-]\d{2}:\d{2}$"#, options: .regularExpression) != nil
                ? expectedString
                : "\(expectedString)Z"
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = value.range(of: #"\.\d+"#, options: .regularExpression) == nil
                ? [.withInternetDateTime]
                : [.withInternetDateTime, .withFractionalSeconds]
            let expected = try XCTUnwrap(formatter.date(from: normalized))
            XCTAssertEqual(meter.lastUpdated?.timeIntervalSince1970 ?? 0, expected.timeIntervalSince1970, accuracy: 0.001)
        }
    }

    func testDecodesSnakeCaseFixtureResources() throws {
        let meters = try DashboardJSON.decoder().decode(
            MetersResponse.self,
            from: fixture("meters")
        )
        XCTAssertEqual(meters.meters.count, 1)
        XCTAssertEqual(meters.meters[0].deviceID, "C76B0046301A")
        XCTAssertEqual(meters.meters[0].currentTemperature, 20)
        XCTAssertEqual(meters.meters[0].currentHumidity, 71)
        XCTAssertEqual(meters.meters[0].hubDeviceID, nil)
        XCTAssertNotNil(meters.meters[0].lastUpdated)

        let status = try DashboardJSON.decoder().decode(StatusResponse.self, from: fixture("status"))
        XCTAssertTrue(status.isRateLimited)
        XCTAssertEqual(status.backoffRemaining, 42)
        XCTAssertEqual(status.metersCount, 1)

        let history = try DashboardJSON.decoder().decode(HistoryResponse.self, from: fixture("history"))
        XCTAssertEqual(history.deviceID, "C76B0046301A")
        XCTAssertEqual(history.timeScale, "hour")
        XCTAssertEqual(history.history.first?.temperature, 24.1)
        XCTAssertEqual(history.history.first?.battery, 100)

        let refresh = try DashboardJSON.decoder().decode(RefreshResponse.self, from: fixture("refresh"))
        XCTAssertEqual(refresh.status, "success")
        XCTAssertEqual(refresh.metersCount, 6)
    }

    private func fixture(_ name: String) throws -> Data {
        let url = Bundle.module.url(forResource: name, withExtension: "json", subdirectory: "Fixtures")
            ?? Bundle.module.url(forResource: name, withExtension: "json")
        return try Data(contentsOf: XCTUnwrap(url))
    }
}
