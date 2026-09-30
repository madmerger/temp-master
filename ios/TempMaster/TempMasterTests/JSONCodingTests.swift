import XCTest
@testable import TempMaster

final class JSONCodingTests: XCTestCase {
    private func decode<T: Decodable>(_ type: T.Type, _ json: String) throws -> T {
        try JSONCoding.decoder().decode(T.self, from: Data(json.utf8))
    }

    func testMetersPayloadMicrosecondsNullBatteryHubID() throws {
        let json = """
        {"meters": [{
            "device_id": "SEED-D1", "device_name": "Bedroom Meter",
            "device_type": "MeterPlus", "hub_device_id": "",
            "current_temperature": 22.3, "current_humidity": 80,
            "battery": null,
            "last_updated": "2026-09-30T04:13:18.318307+00:00"
        }, {
            "device_id": "SEED-D5", "device_name": "ネズミ",
            "device_type": "Meter", "hub_device_id": null,
            "current_temperature": null, "current_humidity": null,
            "battery": null, "last_updated": null
        }], "last_updated": "2026-09-30T04:13:18.318307+00:00"}
        """
        let resp = try decode(MetersResponse.self, json)
        XCTAssertEqual(resp.meters.count, 2)
        XCTAssertEqual(resp.meters[0].battery, nil)
        XCTAssertEqual(resp.meters[0].hubDeviceID, "")
        XCTAssertNotNil(resp.meters[0].lastUpdated)
        XCTAssertNil(resp.meters[1].lastUpdated)
    }

    func testStatusToleratesExtraKeys() throws {
        // Prod /api/status includes `user_configured`.
        let json = """
        {"configured": true, "meters_count": 22, "is_rate_limited": false,
         "backoff_remaining": 0, "last_api_call": 1759200000.123,
         "collection_interval": 3600, "user_configured": true}
        """
        let status = try decode(ServiceStatus.self, json)
        XCTAssertTrue(status.configured)
        XCTAssertEqual(status.metersCount, 22)
        XCTAssertEqual(status.collectionInterval, 3600)
    }

    func testHistoryPayload() throws {
        let json = """
        {"device_id": "SEED-D1", "time_scale": "day",
         "history": [
           {"timestamp": "2026-09-30T04:00:00Z", "temperature": 22.0,
            "humidity": 79, "battery": 20},
           {"timestamp": "2026-09-30T05:00:00.5+00:00", "temperature": 22.3,
            "humidity": 80, "battery": null}],
         "device": null}
        """
        let resp = try decode(HistoryResponse.self, json)
        XCTAssertEqual(resp.timeScale, .day)
        XCTAssertEqual(resp.history.count, 2)
        XCTAssertNil(resp.history[1].battery)
    }

    func testDateParseVariants() {
        XCTAssertNotNil(JSONCoding.parse("2026-09-30T04:13:18Z"))
        XCTAssertNotNil(JSONCoding.parse("2026-09-30T04:13:18.1+00:00"))
        XCTAssertNotNil(JSONCoding.parse("2026-09-30T04:13:18.318307+00:00"))
        XCTAssertNotNil(JSONCoding.parse("2026-09-30T04:13:18+09:00"))
        XCTAssertNil(JSONCoding.parse("not a date"))
        XCTAssertNil(JSONCoding.parse("2026-09-30 04:13:18"))
    }

    func testDateOffsetApplied() {
        let z = JSONCoding.parse("2026-09-30T04:13:18Z")!
        let plus9 = JSONCoding.parse("2026-09-30T13:13:18+09:00")!
        XCTAssertEqual(z, plus9)
    }

    func testEncoderFormatRoundTrip() throws {
        let date = Date(timeIntervalSince1970: 1_759_200_000.123456)
        let formatted = JSONCoding.format(date)
        XCTAssertTrue(formatted.hasSuffix("+00:00"))
        XCTAssertTrue(formatted.contains("."))
        XCTAssertEqual(JSONCoding.parse(formatted)!.timeIntervalSince1970,
                       date.timeIntervalSince1970, accuracy: 0.000001)
    }

    func testFractionalSecondsPreserved() {
        let d = JSONCoding.parse("2026-09-30T04:13:18.5Z")!
        XCTAssertEqual(JSONCoding.format(d), "2026-09-30T04:13:18.500000+00:00")
    }
}
