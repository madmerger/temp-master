import XCTest
import SQLite3
@testable import TempMaster

final class SQLiteStoreTests: XCTestCase {
    private func makeStore() throws -> (SQLiteStore, URL) {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let database = folder.appendingPathComponent("app.db")
        return (try SQLiteStore(url: database), folder)
    }

    private func names(in databaseURL: URL, type: String) throws -> Set<String> {
        var database: OpaquePointer?
        XCTAssertEqual(sqlite3_open(databaseURL.path, &database), SQLITE_OK)
        defer { sqlite3_close(database) }
        var statement: OpaquePointer?
        XCTAssertEqual(sqlite3_prepare_v2(database, "SELECT name FROM sqlite_master WHERE type = '\(type)'", -1, &statement, nil), SQLITE_OK)
        defer { sqlite3_finalize(statement) }
        var result = Set<String>()
        while sqlite3_step(statement) == SQLITE_ROW {
            if let value = sqlite3_column_text(statement, 0) {
                result.insert(String(cString: UnsafeRawPointer(value).assumingMemoryBound(to: CChar.self)))
            }
        }
        return result
    }

    func testSchemaUpsertReadingsLatencyFiltersAndStats() throws {
        let (store, folder) = try makeStore()
        defer { try? FileManager.default.removeItem(at: folder) }
        let tables = try names(in: folder.appendingPathComponent("app.db"), type: "table")
        XCTAssertTrue(tables.isSuperset(of: ["devices", "readings", "latency_logs"]))
        let indexes = try names(in: folder.appendingPathComponent("app.db"), type: "index")
        XCTAssertTrue(indexes.isSuperset(of: ["idx_readings_device_timestamp", "idx_latency_logs_timestamp", "idx_latency_logs_endpoint"]))

        let now = Date(timeIntervalSince1970: 1_700_000_000)
        try store.upsertDevice(MeterDevice(deviceId: "d1", deviceName: "old", deviceType: "Meter"))
        try store.upsertDevice(MeterDevice(deviceId: "d1", deviceName: "new", deviceType: "Meter", currentTemperature: 20))
        XCTAssertEqual(try store.allDevices().first?.deviceName, "new")

        try store.insertReading(deviceId: "d1", reading: MeterReading(timestamp: now.addingTimeInterval(20), temperature: 22, humidity: 45, battery: nil))
        try store.insertReading(deviceId: "d1", reading: MeterReading(timestamp: now, temperature: 20, humidity: 40, battery: 90))
        XCTAssertEqual(try store.readings(deviceId: "d1", since: now).map(\.temperature), [20, 22])
        XCTAssertEqual(try store.readings(deviceId: "d1", since: now.addingTimeInterval(10)).map(\.temperature), [22])

        try store.insertLatencyLog(LatencyLog(endpoint: "/a", deviceId: "d1", timestamp: now, latencyMs: 100, statusCode: 200, success: true))
        try store.insertLatencyLog(LatencyLog(endpoint: "/b", deviceId: "d2", timestamp: now.addingTimeInterval(10), latencyMs: 300, statusCode: 500, success: false))
        XCTAssertEqual(try store.latencyLogs(LatencyLogQuery(endpoint: "/a")).map(\.endpoint), ["/a"])
        XCTAssertEqual(try store.latencyLogs(LatencyLogQuery(deviceId: "d2")).first?.endpoint, "/b")
        XCTAssertEqual(try store.latencyLogs(LatencyLogQuery(limit: 1)).first?.latencyMs, 300)
        let stats = try store.latencyStats(start: nil, end: nil)
        XCTAssertEqual(stats.totalCalls, 2)
        XCTAssertEqual(stats.avgLatencyMs, 200)
        XCTAssertEqual(stats.minLatencyMs, 100)
        XCTAssertEqual(stats.maxLatencyMs, 300)
        XCTAssertEqual(stats.successfulCalls, 1)
        XCTAssertEqual(stats.failedCalls, 1)
        XCTAssertEqual(stats.successRate, 50)
        let empty = try store.latencyStats(start: now.addingTimeInterval(100), end: nil)
        XCTAssertEqual(empty.totalCalls, 0)
        XCTAssertNil(empty.avgLatencyMs)
        XCTAssertNil(empty.minLatencyMs)
        XCTAssertNil(empty.maxLatencyMs)
        XCTAssertEqual(empty.successRate, 0)
    }

    func testImportValidatesBeforeWritingAndImportsValidPayload() throws {
        let (store, folder) = try makeStore()
        defer { try? FileManager.default.removeItem(at: folder) }
        let invalid = Data(#"{"devices":[{"device_id":"first","device_name":"First","device_type":"Meter","readings":[]},{"device_id":"second","device_name":"Second","device_type":"Meter","readings":[{"timestamp":"invalid","temperature":1,"humidity":2}]}]}"#.utf8)
        XCTAssertThrowsError(try store.importPayload(invalid))
        XCTAssertTrue(try store.allDevices().isEmpty)
        XCTAssertEqual(try store.latencyStats(start: nil, end: nil).totalCalls, 0)

        let valid = Data(#"{"devices":[{"device_id":"d1","device_name":"Meter","device_type":"Meter","last_updated":"2024-01-02T03:04:05Z","readings":[{"timestamp":"2024-01-02T03:04:05.123456Z","temperature":19,"humidity":42,"battery":90}]}]}"#.utf8)
        let result = try store.importPayload(valid)
        XCTAssertEqual(result.importedDevices, 1)
        XCTAssertEqual(result.importedReadings, 1)
        XCTAssertEqual(try store.readings(deviceId: "d1", since: .distantPast).count, 1)
    }

    func testCleanupAndSQLiteBackup() throws {
        let (store, folder) = try makeStore()
        defer { try? FileManager.default.removeItem(at: folder) }
        let now = Date(timeIntervalSince1970: 1_700_000_000)
        try store.upsertDevice(MeterDevice(deviceId: "d1", deviceName: "D1", deviceType: "Meter"))
        try store.insertReading(deviceId: "d1", reading: MeterReading(timestamp: now.addingTimeInterval(-31_536_001), temperature: 1, humidity: 2, battery: nil))
        try store.insertReading(deviceId: "d1", reading: MeterReading(timestamp: now, temperature: 19, humidity: 42, battery: 90))
        try store.insertLatencyLog(LatencyLog(endpoint: "/old", timestamp: now.addingTimeInterval(-2_592_001), latencyMs: 1, statusCode: 500, success: false))
        try store.insertLatencyLog(LatencyLog(endpoint: "/new", timestamp: now, latencyMs: 2, statusCode: 200, success: true))
        try store.cleanupOldReadings(now: now)
        try store.cleanupOldLatencyLogs(now: now)
        XCTAssertEqual(try store.readings(deviceId: "d1", since: .distantPast).count, 1)
        XCTAssertEqual(try store.latencyLogs(LatencyLogQuery()).map(\.endpoint), ["/new"])

        let backup = folder.appendingPathComponent("backup.db")
        try store.backup(to: backup)
        let header = try Data(contentsOf: backup).prefix(16)
        XCTAssertEqual(String(data: header, encoding: .utf8), "SQLite format 3\u{0}")
        XCTAssertTrue(try names(in: backup, type: "table").isSuperset(of: ["devices", "readings", "latency_logs"]))
    }
}
