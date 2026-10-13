import Foundation
import SQLite3

final class SQLiteStore: @unchecked Sendable {
    private var database: OpaquePointer?
    private let lock = NSRecursiveLock()
    private static let transient = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

    init(url: URL) throws {
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        guard sqlite3_open_v2(url.path, &database, SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE | SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK else {
            throw Self.databaseError(database)
        }
        sqlite3_busy_timeout(database, 5_000)
        try execute("""
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
        try execute("""
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
        try execute("CREATE INDEX IF NOT EXISTS idx_readings_device_timestamp ON readings(device_id, timestamp)")
        try execute("""
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
        try execute("CREATE INDEX IF NOT EXISTS idx_latency_logs_timestamp ON latency_logs(timestamp)")
        try execute("CREATE INDEX IF NOT EXISTS idx_latency_logs_endpoint ON latency_logs(endpoint)")
    }

    deinit {
        close()
    }

    func close() {
        lock.lock()
        defer { lock.unlock() }
        guard let database, sqlite3_close(database) == SQLITE_OK else { return }
        self.database = nil
    }

    func upsertDevice(_ device: MeterDevice) throws {
        lock.lock()
        defer { lock.unlock() }
        try run("""
            INSERT OR REPLACE INTO devices
            (device_id, device_name, device_type, hub_device_id, current_temperature, current_humidity, battery, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                .text(device.deviceId), .text(device.deviceName), .text(device.deviceType), .optionalText(device.hubDeviceId),
                .optionalDouble(device.currentTemperature), .optionalInt(device.currentHumidity), .optionalInt(device.battery),
                .optionalText(device.lastUpdatedRaw)
            ])
    }

    func insertReading(deviceId: String, reading: MeterReading) throws {
        lock.lock()
        defer { lock.unlock() }
        try run("INSERT INTO readings (device_id, timestamp, temperature, humidity, battery) VALUES (?, ?, ?, ?, ?)", [
            .text(deviceId), .text(ISO8601Parsing.encode(reading.timestamp)), .double(reading.temperature), .int(reading.humidity), .optionalInt(reading.battery)
        ])
    }

    func allDevices() throws -> [MeterDevice] {
        lock.lock()
        defer { lock.unlock() }
        return try query("SELECT * FROM devices ORDER BY rowid", []) { statement in
            MeterDevice(
                deviceId: text(statement, 0) ?? "",
                deviceName: text(statement, 1) ?? "",
                deviceType: text(statement, 2) ?? "",
                hubDeviceId: text(statement, 3),
                currentTemperature: double(statement, 4),
                currentHumidity: integer(statement, 5),
                battery: integer(statement, 6),
                lastUpdatedRaw: text(statement, 7)
            )
        }
    }

    func readings(deviceId: String, since: Date) throws -> [MeterReading] {
        lock.lock()
        defer { lock.unlock() }
        return try query("SELECT timestamp, temperature, humidity, battery FROM readings WHERE device_id = ? AND timestamp >= ? ORDER BY timestamp ASC", [
            .text(deviceId), .text(ISO8601Parsing.encode(since))
        ]) { statement in
            MeterReading(
                timestamp: ISO8601Parsing.parse(text(statement, 0) ?? "") ?? .distantPast,
                temperature: sqlite3_column_double(statement, 1),
                humidity: Int(sqlite3_column_int64(statement, 2)),
                battery: integer(statement, 3)
            )
        }
    }

    func insertLatencyLog(_ log: LatencyLog) throws {
        lock.lock()
        defer { lock.unlock() }
        try run("INSERT INTO latency_logs (endpoint, device_id, timestamp, latency_ms, status_code, success, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)", [
            .text(log.endpoint), .optionalText(log.deviceId), .text(ISO8601Parsing.encode(log.timestamp)), .double(log.latencyMs),
            .int(log.statusCode), .int(log.success ? 1 : 0), .optionalText(log.errorMessage)
        ])
    }

    func latencyLogs(_ filter: LatencyLogQuery) throws -> [LatencyLog] {
        lock.lock()
        defer { lock.unlock() }
        var clauses = [String]()
        var bindings = [Binding]()
        if let start = filter.start { clauses.append("timestamp >= ?"); bindings.append(.text(ISO8601Parsing.encode(start))) }
        if let end = filter.end { clauses.append("timestamp <= ?"); bindings.append(.text(ISO8601Parsing.encode(end))) }
        if let endpoint = filter.endpoint, !endpoint.isEmpty { clauses.append("endpoint = ?"); bindings.append(.text(endpoint)) }
        if let deviceId = filter.deviceId, !deviceId.isEmpty { clauses.append("device_id = ?"); bindings.append(.text(deviceId)) }
        let whereClause = clauses.isEmpty ? "" : " WHERE " + clauses.joined(separator: " AND ")
        bindings.append(.int(max(0, filter.limit)))
        return try query("SELECT id, endpoint, device_id, timestamp, latency_ms, status_code, success, error_message FROM latency_logs\(whereClause) ORDER BY timestamp DESC LIMIT ?", bindings) { statement in
            LatencyLog(
                id: Int(sqlite3_column_int64(statement, 0)),
                endpoint: text(statement, 1) ?? "",
                deviceId: text(statement, 2),
                timestamp: ISO8601Parsing.parse(text(statement, 3) ?? "") ?? .distantPast,
                latencyMs: sqlite3_column_double(statement, 4),
                statusCode: Int(sqlite3_column_int64(statement, 5)),
                success: sqlite3_column_int(statement, 6) != 0,
                errorMessage: text(statement, 7)
            )
        }
    }

    func latencyStats(start: Date?, end: Date?) throws -> LatencyStats {
        lock.lock()
        defer { lock.unlock() }
        var clauses = [String]()
        var bindings = [Binding]()
        if let start { clauses.append("timestamp >= ?"); bindings.append(.text(ISO8601Parsing.encode(start))) }
        if let end { clauses.append("timestamp <= ?"); bindings.append(.text(ISO8601Parsing.encode(end))) }
        let whereClause = clauses.isEmpty ? "" : " WHERE " + clauses.joined(separator: " AND ")
        let rows: [LatencyStats] = try query("SELECT COUNT(*), AVG(latency_ms), MIN(latency_ms), MAX(latency_ms), COALESCE(SUM(success), 0) FROM latency_logs\(whereClause)", bindings) { statement in
            let total = Int(sqlite3_column_int64(statement, 0))
            let successful = Int(sqlite3_column_int64(statement, 4))
            return LatencyStats(
                totalCalls: total,
                avgLatencyMs: total == 0 ? nil : optionalDouble(statement, 1),
                minLatencyMs: total == 0 ? nil : optionalDouble(statement, 2),
                maxLatencyMs: total == 0 ? nil : optionalDouble(statement, 3),
                successfulCalls: successful,
                failedCalls: total - successful,
                successRate: total == 0 ? 0 : Double(successful) / Double(total) * 100
            )
        }
        return rows.first ?? .empty
    }

    func importPayload(_ data: Data) throws -> ImportResult {
        let payload: ImportPayload
        do {
            payload = try JSONDecoder().decode(ImportPayload.self, from: data)
            for device in payload.devices {
                if let timestamp = device.lastUpdated, ISO8601Parsing.parse(timestamp) == nil {
                    throw ServiceError.invalidInput(L10n.text("invalid_timestamp"))
                }
                for reading in device.readings where ISO8601Parsing.parse(reading.timestamp) == nil {
                    throw ServiceError.invalidInput(L10n.text("invalid_timestamp"))
                }
            }
        } catch let error as ServiceError {
            throw error
        } catch {
            throw ServiceError.invalidInput(error.localizedDescription)
        }

        lock.lock()
        defer { lock.unlock() }
        try execute("BEGIN IMMEDIATE")
        do {
            for imported in payload.devices {
                let device = MeterDevice(
                    deviceId: imported.deviceId,
                    deviceName: imported.deviceName,
                    deviceType: imported.deviceType,
                    hubDeviceId: imported.hubDeviceId,
                    currentTemperature: imported.currentTemperature,
                    currentHumidity: imported.currentHumidity,
                    battery: imported.battery,
                    lastUpdatedRaw: imported.lastUpdated.map { ISO8601Parsing.encode(ISO8601Parsing.parse($0)!) }
                )
                try run("""
                    INSERT OR REPLACE INTO devices
                    (device_id, device_name, device_type, hub_device_id, current_temperature, current_humidity, battery, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, [
                        .text(device.deviceId), .text(device.deviceName), .text(device.deviceType), .optionalText(device.hubDeviceId),
                        .optionalDouble(device.currentTemperature), .optionalInt(device.currentHumidity), .optionalInt(device.battery),
                        .optionalText(device.lastUpdatedRaw)
                    ])
                for reading in imported.readings {
                    let timestamp = ISO8601Parsing.encode(ISO8601Parsing.parse(reading.timestamp)!)
                    try run("INSERT INTO readings (device_id, timestamp, temperature, humidity, battery) VALUES (?, ?, ?, ?, ?)", [
                        .text(device.deviceId), .text(timestamp), .double(reading.temperature), .int(reading.humidity), .optionalInt(reading.battery)
                    ])
                }
            }
            try execute("COMMIT")
        } catch {
            try? execute("ROLLBACK")
            throw error
        }
        return ImportResult(status: "ok", importedDevices: payload.devices.count, importedReadings: payload.devices.reduce(0) { $0 + $1.readings.count })
    }

    func cleanupOldReadings(now: Date = Date()) throws {
        lock.lock()
        defer { lock.unlock() }
        try run("DELETE FROM readings WHERE timestamp < ?", [.text(ISO8601Parsing.encode(now.addingTimeInterval(-31_536_000)))])
    }

    func cleanupOldLatencyLogs(now: Date = Date()) throws {
        lock.lock()
        defer { lock.unlock() }
        try run("DELETE FROM latency_logs WHERE timestamp < ?", [.text(ISO8601Parsing.encode(now.addingTimeInterval(-2_592_000)))])
    }

    func backup(to url: URL) throws {
        lock.lock()
        defer { lock.unlock() }
        try? FileManager.default.removeItem(at: url)
        var destination: OpaquePointer?
        guard sqlite3_open_v2(url.path, &destination, SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE | SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK,
              let source = database,
              let backup = sqlite3_backup_init(destination, "main", source, "main") else {
            let error = Self.databaseError(destination)
            if let destination { sqlite3_close(destination) }
            throw error
        }
        let stepResult = sqlite3_backup_step(backup, -1)
        let finishResult = sqlite3_backup_finish(backup)
        let closeResult = sqlite3_close(destination)
        guard (stepResult == SQLITE_DONE || stepResult == SQLITE_OK),
              finishResult == SQLITE_OK, closeResult == SQLITE_OK else {
            throw ServiceError.transport("SQLite backup failed")
        }
    }

    private func execute(_ sql: String) throws {
        lock.lock()
        defer { lock.unlock() }
        guard sqlite3_exec(database, sql, nil, nil, nil) == SQLITE_OK else { throw Self.databaseError(database) }
    }

    private func run(_ sql: String, _ bindings: [Binding]) throws {
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(database, sql, -1, &statement, nil) == SQLITE_OK, let statement else {
            throw Self.databaseError(database)
        }
        defer { sqlite3_finalize(statement) }
        try bind(bindings, to: statement)
        guard sqlite3_step(statement) == SQLITE_DONE else { throw Self.databaseError(database) }
    }

    private func query<T>(_ sql: String, _ bindings: [Binding], map: (OpaquePointer) -> T) throws -> [T] {
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(database, sql, -1, &statement, nil) == SQLITE_OK, let statement else {
            throw Self.databaseError(database)
        }
        defer { sqlite3_finalize(statement) }
        try bind(bindings, to: statement)
        var values = [T]()
        while true {
            let result = sqlite3_step(statement)
            if result == SQLITE_DONE { return values }
            guard result == SQLITE_ROW else { throw Self.databaseError(database) }
            values.append(map(statement))
        }
    }

    private func bind(_ bindings: [Binding], to statement: OpaquePointer) throws {
        for (offset, binding) in bindings.enumerated() {
            let index = Int32(offset + 1)
            let result: Int32
            switch binding {
            case let .text(value): result = sqlite3_bind_text(statement, index, value, -1, Self.transient)
            case let .optionalText(value):
                if let value { result = sqlite3_bind_text(statement, index, value, -1, Self.transient) } else { result = sqlite3_bind_null(statement, index) }
            case let .double(value): result = sqlite3_bind_double(statement, index, value)
            case let .optionalDouble(value):
                if let value { result = sqlite3_bind_double(statement, index, value) } else { result = sqlite3_bind_null(statement, index) }
            case let .int(value): result = sqlite3_bind_int64(statement, index, sqlite3_int64(value))
            case let .optionalInt(value):
                if let value { result = sqlite3_bind_int64(statement, index, sqlite3_int64(value)) } else { result = sqlite3_bind_null(statement, index) }
            }
            guard result == SQLITE_OK else { throw Self.databaseError(database) }
        }
    }

    private static func databaseError(_ database: OpaquePointer?) -> ServiceError {
        .transport(database.flatMap { sqlite3_errmsg($0) }.map { String(cString: $0) } ?? "SQLite error")
    }

    private func text(_ statement: OpaquePointer, _ column: Int32) -> String? {
        guard sqlite3_column_type(statement, column) != SQLITE_NULL, let value = sqlite3_column_text(statement, column) else { return nil }
        return String(cString: value)
    }
    private func double(_ statement: OpaquePointer, _ column: Int32) -> Double? {
        sqlite3_column_type(statement, column) == SQLITE_NULL ? nil : sqlite3_column_double(statement, column)
    }
    private func integer(_ statement: OpaquePointer, _ column: Int32) -> Int? {
        sqlite3_column_type(statement, column) == SQLITE_NULL ? nil : Int(sqlite3_column_int64(statement, column))
    }
    private func optionalDouble(_ statement: OpaquePointer, _ column: Int32) -> Double? { double(statement, column) }

    private enum Binding {
        case text(String)
        case optionalText(String?)
        case double(Double)
        case optionalDouble(Double?)
        case int(Int)
        case optionalInt(Int?)
    }
}
