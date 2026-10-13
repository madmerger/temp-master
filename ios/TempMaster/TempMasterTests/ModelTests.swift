import XCTest
@testable import TempMaster

final class ModelTests: XCTestCase {
    func testTimestampVariantsAndUnknownFields() throws {
        for fraction in ["", ".1", ".12", ".123", ".1234", ".12345", ".123456"] {
            for suffix in ["Z", "+00:00", ""] {
                let raw = "2024-01-02T03:04:05\(fraction)\(suffix)"
                XCTAssertNotNil(ISO8601Parsing.parse(raw), raw)
            }
        }
        XCTAssertEqual(
            ISO8601Parsing.encode(ISO8601Parsing.parse("2024-01-02T03:04:05.123456Z")!),
            "2024-01-02T03:04:05.123456+00:00"
        )
        XCTAssertEqual(
            ISO8601Parsing.parse("2024-01-02T05:04:05+02:00"),
            ISO8601Parsing.parse("2024-01-02T03:04:05Z")
        )
        XCTAssertEqual(
            ISO8601Parsing.parse("2024-01-02T22:04:05-05:00"),
            ISO8601Parsing.parse("2024-01-03T03:04:05Z")
        )
        let json = """
        {"meters":[{"device_id":"d1","device_name":"Tag <b>&</b>","device_type":"Meter","current_temperature":null,"current_humidity":null,"battery":null,"last_updated":"invalid","future_field":true}],"last_updated":null,"future_envelope_field":1}
        """.data(using: .utf8)!
        let decoded = try JSONDecoder().decode(MetersResponse.self, from: json)
        XCTAssertNil(decoded.meters[0].currentTemperature)
        XCTAssertNil(decoded.meters[0].currentHumidity)
        XCTAssertNil(decoded.meters[0].battery)
        XCTAssertNil(decoded.meters[0].lastUpdated)
        XCTAssertEqual(decoded.meters[0].deviceName, "Tag <b>&</b>")
    }

    func testStatusIgnoresAdditionalProductionFields() throws {
        let json = """
        {"configured":true,"meters_count":6,"is_rate_limited":false,"backoff_remaining":0,"last_api_call":1700000000,"collection_interval":120,"user_configured":true}
        """.data(using: .utf8)!
        let status = try JSONDecoder().decode(StatusResponse.self, from: json)
        XCTAssertEqual(status.collectionInterval, 120)
        XCTAssertEqual(status.metersCount, 6)
    }
}
