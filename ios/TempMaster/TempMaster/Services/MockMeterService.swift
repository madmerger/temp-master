import Foundation

final class MockMeterService: MeterService, @unchecked Sendable {
    enum Scenario: Equatable {
        case normal
        case rateLimited
        case fetchError
        case backupError
    }

    private let scenario: Scenario
    private let now: Date
    private let lock = NSLock()
    private var meters: [MeterDevice]
    private var histories: [String: [MeterReading]]
    private var logs: [LatencyLog]

    init(arguments: [String] = ProcessInfo.processInfo.arguments, now: Date = Date()) {
        self.now = now
        if arguments.contains("-UITestRateLimited") { scenario = .rateLimited }
        else if arguments.contains("-UITestFetchError") { scenario = .fetchError }
        else if arguments.contains("-UITestBackupError") { scenario = .backupError }
        else { scenario = .normal }
        func raw(_ offset: TimeInterval) -> String { ISO8601Parsing.encode(now.addingTimeInterval(-offset)) }
        meters = [
            MeterDevice(deviceId: "SEED-D1", deviceName: "Bedroom Meter", deviceType: "MeterPlus", currentTemperature: 22.3, currentHumidity: 80, battery: 20, lastUpdatedRaw: raw(300)),
            MeterDevice(deviceId: "SEED-D2", deviceName: "外", deviceType: "Meter", currentTemperature: 12.5, currentHumidity: 55, battery: 90, lastUpdatedRaw: raw(600)),
            MeterDevice(deviceId: "SEED-D3", deviceName: "Study Hub", deviceType: "Hub 3", currentTemperature: 23.2, currentHumidity: 75, lastUpdatedRaw: raw(120)),
            MeterDevice(deviceId: "SEED-D4", deviceName: "アワコ", deviceType: "Meter", currentTemperature: 19, currentHumidity: 60, battery: 5, lastUpdatedRaw: raw(8 * 86_400)),
            MeterDevice(deviceId: "SEED-D5", deviceName: "ネズミ", deviceType: "Meter"),
            MeterDevice(deviceId: "SEED-D6", deviceName: "Tag <b>&</b>", deviceType: "Meter Pro CO2", currentTemperature: 25, currentHumidity: 40, battery: 100, lastUpdatedRaw: raw(60))
        ]
        func reading(offset: TimeInterval, temperature: Double, humidity: Int, battery: Int?) -> MeterReading {
            MeterReading(timestamp: now.addingTimeInterval(-offset), temperature: temperature, humidity: humidity, battery: battery)
        }
        let d1Readings = [
            reading(offset: 30 * 60, temperature: 22.3, humidity: 80, battery: 20),
            reading(offset: 2 * 3_600, temperature: 22.0, humidity: 79, battery: 20),
            reading(offset: 3 * 86_400, temperature: 21.5, humidity: 78, battery: 21),
            reading(offset: 10 * 86_400, temperature: 20.9, humidity: 75, battery: 22),
            reading(offset: 100 * 86_400, temperature: 18.2, humidity: 70, battery: 25)
        ]
        let d2Readings = [
            reading(offset: 45 * 60, temperature: 12.5, humidity: 55, battery: 90),
            reading(offset: 20 * 3_600, temperature: 10.1, humidity: 60, battery: 90),
            reading(offset: 6 * 86_400, temperature: 8.4, humidity: 65, battery: 90)
        ]
        histories = [
            "SEED-D1": d1Readings,
            "SEED-D2": d2Readings,
            "SEED-D3": [MeterReading(timestamp: now.addingTimeInterval(-900), temperature: 23.2, humidity: 75, battery: nil)],
            "SEED-D4": [MeterReading(timestamp: now.addingTimeInterval(-8 * 86_400), temperature: 19, humidity: 60, battery: 5)],
            "SEED-D6": [MeterReading(timestamp: now.addingTimeInterval(-60), temperature: 25, humidity: 40, battery: 100)]
        ]
        logs = [
            LatencyLog(id: 1, endpoint: "/devices", timestamp: now.addingTimeInterval(-3_600), latencyMs: 120.5, statusCode: 200, success: true),
            LatencyLog(id: 2, endpoint: "/devices/SEED-D1/status", deviceId: "SEED-D1", timestamp: now.addingTimeInterval(-3_000), latencyMs: 80, statusCode: 200, success: true),
            LatencyLog(id: 3, endpoint: "/devices/SEED-D2/status", deviceId: "SEED-D2", timestamp: now.addingTimeInterval(-2_400), latencyMs: 50, statusCode: 429, success: false, errorMessage: "Rate limited. Backing off for 120 seconds"),
            LatencyLog(id: 4, endpoint: "/devices/SEED-D3/status", deviceId: "SEED-D3", timestamp: now.addingTimeInterval(-1_800), latencyMs: 300, statusCode: 500, success: false, errorMessage: "Request error: timeout")
        ]
    }

    func healthz() async throws -> HealthResponse { HealthResponse(status: "ok") }
    func fetchMeters() async throws -> MetersResponse {
        if scenario == .fetchError { throw ServiceError.transport("The operation couldn’t be completed. (NSURLErrorDomain error -1009.)") }
        return lock.withLock { MetersResponse(meters: meters, lastUpdated: nil) }
    }
    func fetchHistory(deviceId: String, timeScale: TimeScale) async throws -> HistoryResponse {
        lock.withLock {
            let cutoff = now.addingTimeInterval(-timeScale.cutoffSeconds)
            return HistoryResponse(history: (histories[deviceId] ?? []).filter { $0.timestamp >= cutoff }.sorted { $0.timestamp < $1.timestamp })
        }
    }
    func refresh() async throws -> RefreshResponse {
        lock.withLock { RefreshResponse(status: "ok", message: "Data collection triggered", metersCount: meters.count) }
    }
    func fetchStatus() async throws -> StatusResponse {
        lock.withLock {
            StatusResponse(configured: false, metersCount: meters.count, isRateLimited: scenario == .rateLimited, backoffRemaining: scenario == .rateLimited ? 120 : 0, lastApiCall: nil, collectionInterval: 3600)
        }
    }
    func fetchLatencyLogs(_ q: LatencyLogQuery) async throws -> LatencyLogsResponse {
        lock.withLock {
            let filtered = logs.filter { log in
                (q.start == nil || log.timestamp >= q.start!) &&
                (q.end == nil || log.timestamp <= q.end!) &&
                (q.endpoint == nil || q.endpoint!.isEmpty || log.endpoint == q.endpoint!) &&
                (q.deviceId == nil || q.deviceId!.isEmpty || log.deviceId == q.deviceId!)
            }.sorted { $0.timestamp > $1.timestamp }.prefix(max(0, q.limit))
            let values = Array(filtered)
            return LatencyLogsResponse(logs: values, count: values.count)
        }
    }
    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats {
        let filtered = logs.filter { (start == nil || $0.timestamp >= start!) && (end == nil || $0.timestamp <= end!) }
        guard !filtered.isEmpty else { return .empty }
        let sum = filtered.reduce(0) { $0 + $1.latencyMs }
        let successful = filtered.filter(\.success).count
        return LatencyStats(totalCalls: filtered.count, avgLatencyMs: sum / Double(filtered.count), minLatencyMs: filtered.map(\.latencyMs).min(), maxLatencyMs: filtered.map(\.latencyMs).max(), successfulCalls: successful, failedCalls: filtered.count - successful, successRate: Double(successful) / Double(filtered.count) * 100)
    }
    func importData(_ json: Data) async throws -> ImportResult {
        let payload: ImportPayload
        do {
            payload = try JSONDecoder().decode(ImportPayload.self, from: json)
            for device in payload.devices {
                if let date = device.lastUpdated, ISO8601Parsing.parse(date) == nil { throw ServiceError.invalidInput(L10n.text("invalid_timestamp")) }
                for reading in device.readings where ISO8601Parsing.parse(reading.timestamp) == nil { throw ServiceError.invalidInput(L10n.text("invalid_timestamp")) }
            }
        } catch let error as ServiceError { throw error }
        catch { throw ServiceError.invalidInput(error.localizedDescription) }
        return lock.withLock {
            for item in payload.devices {
                meters.removeAll { $0.deviceId == item.deviceId }
                meters.append(MeterDevice(deviceId: item.deviceId, deviceName: item.deviceName, deviceType: item.deviceType, hubDeviceId: item.hubDeviceId, currentTemperature: item.currentTemperature, currentHumidity: item.currentHumidity, battery: item.battery, lastUpdatedRaw: item.lastUpdated))
                histories[item.deviceId, default: []].append(contentsOf: item.readings.compactMap {
                    guard let timestamp = ISO8601Parsing.parse($0.timestamp) else { return nil }
                    return MeterReading(timestamp: timestamp, temperature: $0.temperature, humidity: $0.humidity, battery: $0.battery)
                })
            }
            return ImportResult(status: "ok", importedDevices: payload.devices.count, importedReadings: payload.devices.reduce(0) { $0 + $1.readings.count })
        }
    }
    func downloadBackup() async throws -> BackupFile {
        if scenario == .backupError {
            throw BackupError(status: 500, requestId: "0123456789ab", transportError: nil)
        }
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let file = folder.appendingPathComponent("switchbot_backup.db")
        try Data("Mock backup".utf8).write(to: file)
        return BackupFile(fileURL: file, filename: "switchbot_backup.db")
    }
}
