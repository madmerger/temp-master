import Foundation
import SQLite3

private let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

/// Thread-safe SQLite store with a schema identical to main.py init_database.
final class SQLiteStore: @unchecked Sendable {
    private let queue = DispatchQueue(label: "com.madmerger.TempMaster.sqlite")
    private var db: OpaquePointer?
    let path: String

    init(path: String) throws {
        self.path = path
        try FileManager.default.createDirectory(
            at: URL(fileURLWithPath: path).deletingLastPathComponent(),
            withIntermediateDirectories: true)
        var openError: Error?
        queue.sync {
            if sqlite3_open(path, &db) != SQLITE_OK {
                openError = MeterServiceError.invalidImport(
                    "Failed to open database at \(path)")
                return
            }
        }
        if let openError { throw openError }
        try exec("""
            CREATE TABLE IF NOT EXISTS devices (
                device_id TEXT PRIMARY KEY,
                device_name TEXT NOT NULL,
                device_type TEXT NOT NULL,
                hub_device_id TEXT,
                current_temperature REAL,
                current_humidity INTEGER,
                battery INTEGER,
                last_updated TEXT
            )
            """)
        try exec("""
            CREATE TABLE IF NOT EXISTS readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                temperature REAL NOT NULL,
                humidity INTEGER NOT NULL,
                battery INTEGER,
                FOREIGN KEY (device_id) REFERENCES devices(device_id)
            )
            """)
        try exec("""
            CREATE INDEX IF NOT EXISTS idx_readings_device_timestamp
            ON readings(device_id, timestamp)
            """)
        try exec("""
            CREATE TABLE IF NOT EXISTS latency_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                endpoint TEXT NOT NULL,
                device_id TEXT,
                timestamp TEXT NOT NULL,
                latency_ms REAL NOT NULL,
                status_code INTEGER NOT NULL,
                success INTEGER NOT NULL,
                error_message TEXT
            )
            """)
        try exec("""
            CREATE INDEX IF NOT EXISTS idx_latency_logs_timestamp
            ON latency_logs(timestamp)
            """)
        try exec("""
            CREATE INDEX IF NOT EXISTS idx_latency_logs_endpoint
            ON latency_logs(endpoint)
            """)
    }

    deinit { sqlite3_close(db) }

    // MARK: - low level

    private func exec(_ sql: String) throws {
        var err: Error?
        queue.sync {
            if sqlite3_exec(db, sql, nil, nil, nil) != SQLITE_OK {
                err = MeterServiceError.invalidImport(Self.lastError(db))
            }
        }
        if let err { throw err }
    }

    private static func lastError(_ db: OpaquePointer?) -> String {
        String(cString: sqlite3_errmsg(db))
    }

    private func bind(_ stmt: OpaquePointer?, _ index: Int32, _ value: String?) {
        if let value {
            sqlite3_bind_text(stmt, index, value, -1, SQLITE_TRANSIENT)
        } else {
            sqlite3_bind_null(stmt, index)
        }
    }

    private func bind(_ stmt: OpaquePointer?, _ index: Int32, _ value: Double?) {
        if let value { sqlite3_bind_double(stmt, index, value) }
        else { sqlite3_bind_null(stmt, index) }
    }

    private func bind(_ stmt: OpaquePointer?, _ index: Int32, _ value: Int?) {
        if let value { sqlite3_bind_int64(stmt, index, Int64(value)) }
        else { sqlite3_bind_null(stmt, index) }
    }

    private static func text(_ stmt: OpaquePointer?, _ col: Int32) -> String? {
        guard let c = sqlite3_column_text(stmt, col) else { return nil }
        return String(cString: c)
    }

    private func withStatement<T>(_ sql: String,
                                  _ body: (OpaquePointer?) throws -> T) throws -> T {
        try queue.sync {
            var stmt: OpaquePointer?
            guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
                throw MeterServiceError.invalidImport(Self.lastError(db))
            }
            defer { sqlite3_finalize(stmt) }
            return try body(stmt)
        }
    }

    // MARK: - devices

    func allDevices() -> [MeterDevice] {
        var out: [MeterDevice] = []
        try? withStatement("SELECT * FROM devices") { stmt in
            while sqlite3_step(stmt) == SQLITE_ROW {
                out.append(MeterDevice(
                    deviceID: Self.text(stmt, 0) ?? "",
                    deviceName: Self.text(stmt, 1) ?? "",
                    deviceType: Self.text(stmt, 2) ?? "",
                    hubDeviceID: Self.text(stmt, 3),
                    currentTemperature: sqlite3_column_type(stmt, 4) == SQLITE_NULL
                        ? nil : sqlite3_column_double(stmt, 4),
                    currentHumidity: sqlite3_column_type(stmt, 5) == SQLITE_NULL
                        ? nil : Int(sqlite3_column_int64(stmt, 5)),
                    battery: sqlite3_column_type(stmt, 6) == SQLITE_NULL
                        ? nil : Int(sqlite3_column_int64(stmt, 6)),
                    lastUpdated: Self.text(stmt, 7).flatMap(JSONCoding.parse)))
            }
        }
        return out
    }

    func device(_ deviceID: String) -> MeterDevice? {
        allDevices().first { $0.deviceID == deviceID }
    }

    func upsertDevice(_ device: MeterDevice) throws {
        try withStatement("""
            INSERT OR REPLACE INTO devices
            (device_id, device_name, device_type, hub_device_id,
             current_temperature, current_humidity, battery, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """) { stmt in
            bind(stmt, 1, device.deviceID)
            bind(stmt, 2, device.deviceName)
            bind(stmt, 3, device.deviceType)
            bind(stmt, 4, device.hubDeviceID)
            bind(stmt, 5, device.currentTemperature)
            bind(stmt, 6, device.currentHumidity)
            bind(stmt, 7, device.battery)
            bind(stmt, 8, device.lastUpdated.map(JSONCoding.format))
            if sqlite3_step(stmt) != SQLITE_DONE {
                throw MeterServiceError.invalidImport(Self.lastError(db))
            }
        }
    }

    // MARK: - readings

    func insertReading(deviceID: String, reading: MeterReading) throws {
        try withStatement("""
            INSERT INTO readings (device_id, timestamp, temperature, humidity, battery)
            VALUES (?, ?, ?, ?, ?)
            """) { stmt in
            bind(stmt, 1, deviceID)
            bind(stmt, 2, JSONCoding.format(reading.timestamp))
            bind(stmt, 3, reading.temperature)
            bind(stmt, 4, reading.humidity)
            bind(stmt, 5, reading.battery)
            if sqlite3_step(stmt) != SQLITE_DONE {
                throw MeterServiceError.invalidImport(Self.lastError(db))
            }
        }
    }

    /// B-04: readings at or after `since`, ascending.
    func readings(deviceID: String, since: Date) -> [MeterReading] {
        var out: [MeterReading] = []
        try? withStatement("""
            SELECT timestamp, temperature, humidity, battery FROM readings
            WHERE device_id = ? AND timestamp >= ?
            ORDER BY timestamp ASC
            """) { stmt in
            bind(stmt, 1, deviceID)
            bind(stmt, 2, JSONCoding.format(since))
            while sqlite3_step(stmt) == SQLITE_ROW {
                out.append(MeterReading(
                    timestamp: Self.text(stmt, 0).flatMap(JSONCoding.parse) ?? since,
                    temperature: sqlite3_column_double(stmt, 1),
                    humidity: Int(sqlite3_column_int64(stmt, 2)),
                    battery: sqlite3_column_type(stmt, 3) == SQLITE_NULL
                        ? nil : Int(sqlite3_column_int64(stmt, 3))))
            }
        }
        return out
    }

    // MARK: - latency logs

    func insertLatencyLog(endpoint: String, deviceID: String?, timestamp: Date,
                          latencyMs: Double, statusCode: Int, success: Bool,
                          errorMessage: String?) throws {
        try withStatement("""
            INSERT INTO latency_logs
            (endpoint, device_id, timestamp, latency_ms, status_code, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """) { stmt in
            bind(stmt, 1, endpoint)
            bind(stmt, 2, deviceID)
            bind(stmt, 3, JSONCoding.format(timestamp))
            bind(stmt, 4, latencyMs)
            bind(stmt, 5, statusCode)
            bind(stmt, 6, success ? 1 : 0)
            bind(stmt, 7, errorMessage)
            if sqlite3_step(stmt) != SQLITE_DONE {
                throw MeterServiceError.invalidImport(Self.lastError(db))
            }
        }
    }

    /// B-12: newest first, limit (default 100).
    func latencyLogs(_ filter: LatencyLogFilter) -> [LatencyLog] {
        var sql = """
            SELECT id, endpoint, device_id, timestamp, latency_ms, status_code,
                   success, error_message FROM latency_logs WHERE 1=1
            """
        var params: [String] = []
        if let start = filter.start {
            sql += " AND timestamp >= ?"
            params.append(JSONCoding.format(start))
        }
        if let end = filter.end {
            sql += " AND timestamp <= ?"
            params.append(JSONCoding.format(end))
        }
        if let endpoint = filter.endpoint, !endpoint.isEmpty {
            sql += " AND endpoint = ?"
            params.append(endpoint)
        }
        if let deviceID = filter.deviceID, !deviceID.isEmpty {
            sql += " AND device_id = ?"
            params.append(deviceID)
        }
        sql += " ORDER BY timestamp DESC LIMIT ?"
        var out: [LatencyLog] = []
        try? withStatement(sql) { stmt in
            for (i, p) in params.enumerated() { bind(stmt, Int32(i + 1), p) }
            bind(stmt, Int32(params.count + 1), filter.limit)
            while sqlite3_step(stmt) == SQLITE_ROW {
                out.append(LatencyLog(
                    id: Int(sqlite3_column_int64(stmt, 0)),
                    endpoint: Self.text(stmt, 1) ?? "",
                    deviceID: Self.text(stmt, 2),
                    timestamp: Self.text(stmt, 3).flatMap(JSONCoding.parse) ?? Date.distantPast,
                    latencyMs: sqlite3_column_double(stmt, 4),
                    statusCode: Int(sqlite3_column_int64(stmt, 5)),
                    success: sqlite3_column_int64(stmt, 6) != 0,
                    errorMessage: Self.text(stmt, 7)))
            }
        }
        return out
    }

    /// B-11: same null/0 semantics as get_latency_stats.
    func latencyStats(start: Date?, end: Date?) -> LatencyStats {
        var sql = """
            SELECT COUNT(*) as total_calls, AVG(latency_ms) as avg_latency,
                   MIN(latency_ms) as min_latency, MAX(latency_ms) as max_latency,
                   SUM(success) as successful_calls
            FROM latency_logs WHERE 1=1
            """
        var params: [String] = []
        if let start {
            sql += " AND timestamp >= ?"
            params.append(JSONCoding.format(start))
        }
        if let end {
            sql += " AND timestamp <= ?"
            params.append(JSONCoding.format(end))
        }
        var result = LatencyStats(totalCalls: 0, avgLatencyMs: nil, minLatencyMs: nil,
                                  maxLatencyMs: nil, successfulCalls: 0,
                                  failedCalls: 0, successRate: 0)
        try? withStatement(sql) { stmt in
            for (i, p) in params.enumerated() { bind(stmt, Int32(i + 1), p) }
            guard sqlite3_step(stmt) == SQLITE_ROW else {
                return
            }
            let total = Int(sqlite3_column_int64(stmt, 0))
            let success = Int(sqlite3_column_int64(stmt, 4))
            result = LatencyStats(
                totalCalls: total,
                avgLatencyMs: sqlite3_column_type(stmt, 1) == SQLITE_NULL
                    ? nil : sqlite3_column_double(stmt, 1),
                minLatencyMs: sqlite3_column_type(stmt, 2) == SQLITE_NULL
                    ? nil : sqlite3_column_double(stmt, 2),
                maxLatencyMs: sqlite3_column_type(stmt, 3) == SQLITE_NULL
                    ? nil : sqlite3_column_double(stmt, 3),
                successfulCalls: success,
                failedCalls: total - success,
                successRate: total > 0 ? Double(success) / Double(total) * 100 : 0)
        }
        return result
    }

    // MARK: - cleanup (B-17)

    func deleteReadings(olderThan cutoff: Date) throws {
        try withStatement("DELETE FROM readings WHERE timestamp < ?") { stmt in
            bind(stmt, 1, JSONCoding.format(cutoff))
            sqlite3_step(stmt)
        }
    }

    func deleteLatencyLogs(olderThan cutoff: Date) throws {
        try withStatement("DELETE FROM latency_logs WHERE timestamp < ?") { stmt in
            bind(stmt, 1, JSONCoding.format(cutoff))
            sqlite3_step(stmt)
        }
    }

    // MARK: - import (B-13, V-05)

    /// Single transaction: any invalid timestamp rolls everything back.
    func importData(_ data: ImportData) throws -> ImportResult {
        // Validate timestamps before touching the DB.
        for device in data.devices {
            if let lu = device.lastUpdated, JSONCoding.parse(lu) == nil {
                throw MeterServiceError.invalidImport("Invalid last_updated: \(lu)")
            }
            for reading in device.readings where JSONCoding.parse(reading.timestamp) == nil {
                throw MeterServiceError.invalidImport(
                    "Invalid reading timestamp: \(reading.timestamp)")
            }
        }
        var importedDevices = 0
        var importedReadings = 0
        var thrown: Error?
        queue.sync {
            sqlite3_exec(db, "BEGIN IMMEDIATE TRANSACTION", nil, nil, nil)
            do {
                for device in data.devices {
                    var stmt: OpaquePointer?
                    sqlite3_prepare_v2(db, """
                        INSERT OR REPLACE INTO devices
                        (device_id, device_name, device_type, hub_device_id,
                         current_temperature, current_humidity, battery, last_updated)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, -1, &stmt, nil)
                    bind(stmt, 1, device.deviceID)
                    bind(stmt, 2, device.deviceName)
                    bind(stmt, 3, device.deviceType)
                    bind(stmt, 4, device.hubDeviceID)
                    bind(stmt, 5, device.currentTemperature)
                    bind(stmt, 6, device.currentHumidity)
                    bind(stmt, 7, device.battery)
                    bind(stmt, 8, device.lastUpdated)
                    guard sqlite3_step(stmt) == SQLITE_DONE else {
                        throw MeterServiceError.invalidImport(Self.lastError(db))
                    }
                    sqlite3_finalize(stmt)
                    importedDevices += 1
                    for reading in device.readings {
                        var rstmt: OpaquePointer?
                        sqlite3_prepare_v2(db, """
                            INSERT INTO readings
                            (device_id, timestamp, temperature, humidity, battery)
                            VALUES (?, ?, ?, ?, ?)
                            """, -1, &rstmt, nil)
                        bind(rstmt, 1, device.deviceID)
                        // Normalise Z -> +00:00 so stored strings are comparable
                        let ts = JSONCoding.parse(reading.timestamp)!
                        bind(rstmt, 2, JSONCoding.format(ts))
                        bind(rstmt, 3, reading.temperature)
                        bind(rstmt, 4, reading.humidity)
                        bind(rstmt, 5, reading.battery)
                        guard sqlite3_step(rstmt) == SQLITE_DONE else {
                            throw MeterServiceError.invalidImport(Self.lastError(db))
                        }
                        sqlite3_finalize(rstmt)
                        importedReadings += 1
                    }
                }
                sqlite3_exec(db, "COMMIT", nil, nil, nil)
            } catch {
                sqlite3_exec(db, "ROLLBACK", nil, nil, nil)
                thrown = error
            }
        }
        if let thrown { throw thrown }
        return ImportResult(status: "ok", importedDevices: importedDevices,
                            importedReadings: importedReadings)
    }

    /// B-10: VACUUM INTO a new SQLite file.
    func makeBackup(to url: URL) throws {
        try? FileManager.default.removeItem(at: url)
        let escaped = url.path.replacingOccurrences(of: "'", with: "''")
        try exec("VACUUM INTO '\(escaped)'")
    }
}
