import XCTest
@testable import TempMaster

final class SQLiteStoreTests: XCTestCase {
    private func device(_ id: String, _ lu: Date? = nil) -> MeterDevice {
        MeterDevice(deviceID: id, deviceName: "n\(id)", deviceType: "Meter",
                    currentTemperature: 20.0, currentHumidity: 50, battery: 80,
                    lastUpdated: lu)
    }

    func testSchemaTablesAndIndexes() throws {
        _ = try tempStore() // init runs the full schema; no exception = created
        // Indirectly verified by every other test exercising the tables.
    }

    func testUpsertAndAllDevices() throws {
        let store = try tempStore()
        try store.upsertDevice(device("D1"))
        try store.upsertDevice(device("D2"))
        XCTAssertEqual(store.allDevices().count, 2)
        var d = device("D1")
        d.deviceName = "renamed"
        try store.upsertDevice(d)
        XCTAssertEqual(store.allDevices().count, 2)
        XCTAssertEqual(store.device("D1")?.deviceName, "renamed")
    }

    func testReadingsCutoffAndAscending() throws {
        let store = try tempStore()
        let now = Date()
        try store.insertReading(deviceID: "D1", reading: MeterReading(
            timestamp: now.addingTimeInterval(-7200), temperature: 1, humidity: 1))
        try store.insertReading(deviceID: "D1", reading: MeterReading(
            timestamp: now.addingTimeInterval(-100), temperature: 3, humidity: 1))
        try store.insertReading(deviceID: "D1", reading: MeterReading(
            timestamp: now.addingTimeInterval(-200), temperature: 2, humidity: 1))
        let rs = store.readings(deviceID: "D1", since: now.addingTimeInterval(-3600))
        XCTAssertEqual(rs.map(\.temperature), [2, 3])
    }

    func testLatencyFilterOrderLimit() throws {
        let store = try tempStore()
        let now = Date()
        let rows: [(TimeInterval, String, String?)] = [
            (-3600, "/devices", nil),
            (-3000, "/devices/D1/status", "D1"),
            (-2400, "/devices/D2/status", "D2"),
            (-1800, "/devices/D3/status", "D3"),
        ]
        for (off, ep, did) in rows {
            try store.insertLatencyLog(endpoint: ep, deviceID: did,
                                       timestamp: now.addingTimeInterval(off),
                                       latencyMs: 1, statusCode: 200,
                                       success: true, errorMessage: nil)
        }
        let all = store.latencyLogs(LatencyLogFilter())
        XCTAssertEqual(all.map(\.endpoint),
                       ["/devices/D3/status", "/devices/D2/status",
                        "/devices/D1/status", "/devices"])
        XCTAssertEqual(store.latencyLogs(LatencyLogFilter(endpoint: "/devices")).count, 1)
        XCTAssertEqual(store.latencyLogs(LatencyLogFilter(deviceID: "D1")).count, 1)
        XCTAssertEqual(store.latencyLogs(LatencyLogFilter(limit: 2)).count, 2)
    }

    func testLatencyStatsEmpty() throws {
        let store = try tempStore()
        let stats = store.latencyStats(start: nil, end: nil)
        XCTAssertEqual(stats.totalCalls, 0)
        XCTAssertNil(stats.avgLatencyMs)
        XCTAssertEqual(stats.successRate, 0)
    }

    func testLatencyStatsSeeded() throws {
        // fixtures.md latency rows
        let store = try tempStore()
        let now = Date()
        let rows: [(TimeInterval, String, String?, Double, Int, Bool, String?)] = [
            (-3600, "/devices", nil, 120.5, 200, true, nil),
            (-3000, "/devices/D1/status", "D1", 80.0, 200, true, nil),
            (-2400, "/devices/D2/status", "D2", 50.0, 429, false,
             "Rate limited. Backing off for 120 seconds"),
            (-1800, "/devices/D3/status", "D3", 300.0, 500, false,
             "Request error: timeout"),
        ]
        for (off, ep, did, ms, code, ok, err) in rows {
            try store.insertLatencyLog(endpoint: ep, deviceID: did,
                                       timestamp: now.addingTimeInterval(off),
                                       latencyMs: ms, statusCode: code,
                                       success: ok, errorMessage: err)
        }
        let stats = store.latencyStats(start: nil, end: nil)
        XCTAssertEqual(stats.totalCalls, 4)
        XCTAssertEqual(stats.avgLatencyMs!, 137.625, accuracy: 0.0001)
        XCTAssertEqual(stats.minLatencyMs!, 50.0)
        XCTAssertEqual(stats.maxLatencyMs!, 300.0)
        XCTAssertEqual(stats.successfulCalls, 2)
        XCTAssertEqual(stats.failedCalls, 2)
        XCTAssertEqual(stats.successRate, 50.0)
    }

    func testCleanupThresholds() throws {
        let store = try tempStore()
        let now = Date()
        try store.insertReading(deviceID: "D1", reading: MeterReading(
            timestamp: now.addingTimeInterval(-400 * 86400), temperature: 1, humidity: 1))
        try store.insertReading(deviceID: "D1", reading: MeterReading(
            timestamp: now, temperature: 2, humidity: 1))
        try store.insertLatencyLog(endpoint: "/x", deviceID: nil,
                                   timestamp: now.addingTimeInterval(-31 * 86400),
                                   latencyMs: 1, statusCode: 200, success: true,
                                   errorMessage: nil)
        try store.insertLatencyLog(endpoint: "/y", deviceID: nil, timestamp: now,
                                   latencyMs: 1, statusCode: 200, success: true,
                                   errorMessage: nil)
        try store.deleteReadings(olderThan: now.addingTimeInterval(-365 * 86400))
        try store.deleteLatencyLogs(olderThan: now.addingTimeInterval(-30 * 86400))
        XCTAssertEqual(store.readings(deviceID: "D1", since: .distantPast).count, 1)
        XCTAssertEqual(store.latencyLogs(LatencyLogFilter()).count, 1)
    }

    func testImportRollbackOnBadTimestamp() throws {
        let store = try tempStore()
        let bad = ImportData(devices: [
            ImportDeviceData(deviceID: "D1", deviceName: "a", deviceType: "Meter",
                             lastUpdated: "2026-09-30T04:00:00Z",
                             readings: []),
            ImportDeviceData(deviceID: "D2", deviceName: "b", deviceType: "Meter",
                             lastUpdated: "bogus", readings: []),
        ])
        XCTAssertThrowsError(try store.importData(bad)) { error in
            guard case MeterServiceError.invalidImport = error else {
                return XCTFail("expected invalidImport, got \(error)")
            }
        }
        XCTAssertEqual(store.allDevices().count, 0)
    }

    func testImportSuccess() throws {
        let store = try tempStore()
        let data = ImportData(devices: [
            ImportDeviceData(deviceID: "SEED-D7", deviceName: "バロン",
                             deviceType: "Meter", currentTemperature: 26.4,
                             currentHumidity: 50, battery: 77,
                             lastUpdated: "2026-09-30T04:00:00Z",
                             readings: [
                                ImportReadingData(timestamp: "2026-09-30T04:00:00Z",
                                                  temperature: 26.4, humidity: 50,
                                                  battery: 77),
                                ImportReadingData(
                                    timestamp: "2026-09-30T02:30:00+00:00",
                                    temperature: 26.0, humidity: 52, battery: 77),
                             ]),
        ])
        let result = try store.importData(data)
        XCTAssertEqual(result.importedDevices, 1)
        XCTAssertEqual(result.importedReadings, 2)
        XCTAssertEqual(store.allDevices().count, 1)
        XCTAssertEqual(store.readings(deviceID: "SEED-D7", since: .distantPast).count, 2)
    }

    func testBackupHasSQLiteHeader() throws {
        let store = try tempStore()
        let dest = FileManager.default.temporaryDirectory
            .appendingPathComponent("backup-\(UUID().uuidString).db")
        try store.makeBackup(to: dest)
        let data = try Data(contentsOf: dest).prefix(16)
        XCTAssertEqual(Array(data), Array("SQLite format 3\0".utf8))
    }
}
