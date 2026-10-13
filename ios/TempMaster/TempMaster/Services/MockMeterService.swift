import Foundation
import SQLite3

/// UI-test data source (-UITestMockData): mirrors fixtures.md base devices
/// with NOW-relative timestamps and the 4 seed latency logs.
struct MockMeterService: MeterService {
    var rateLimited: Bool = AppSettings.mockRateLimited

    private static func iso(_ d: Date) -> String { JSONCoding.format(d) }

    private static func device(_ id: String, _ name: String, _ type: String,
                               temp: Double?, hum: Int?, bat: Int?,
                               luOffset: TimeInterval?,
                               readings: [(TimeInterval, Double, Int, Int?)],
                               now: Date) -> (MeterDevice, [MeterReading]) {
        let rs = readings.map { MeterReading(timestamp: now.addingTimeInterval($0.0),
                                             temperature: $0.1, humidity: $0.2,
                                             battery: $0.3) }
        return (MeterDevice(
            deviceID: id, deviceName: name, deviceType: type,
            currentTemperature: temp, currentHumidity: hum, battery: bat,
            lastUpdated: luOffset.map { now.addingTimeInterval($0) }), rs)
    }

    private func base(now: Date = Date())
        -> (devices: [MeterDevice], histories: [String: [MeterReading]]) {
        let M: TimeInterval = 60, H: TimeInterval = 3600, D: TimeInterval = 86400
        let all = [
            Self.device("SEED-D1", "Bedroom Meter", "MeterPlus", temp: 22.3, hum: 80,
                        bat: 20, luOffset: -5 * M, readings: [
                            (-30 * M, 22.3, 80, 20), (-2 * H, 22.0, 79, 20),
                            (-3 * D, 21.5, 78, 21), (-10 * D, 20.9, 75, 22),
                            (-100 * D, 18.2, 70, 25)], now: now),
            Self.device("SEED-D2", "外", "Meter", temp: 12.5, hum: 55, bat: 90,
                        luOffset: -10 * M, readings: [
                            (-45 * M, 12.5, 55, 90), (-20 * H, 10.1, 60, 90),
                            (-6 * D, 8.4, 65, 91)], now: now),
            Self.device("SEED-D3", "Study Hub", "Hub 3", temp: 23.2, hum: 75,
                        bat: nil, luOffset: -2 * M, readings: [
                            (-15 * M, 23.2, 75, nil)], now: now),
            Self.device("SEED-D4", "アワコ", "Meter", temp: 19.0, hum: 60, bat: 5,
                        luOffset: -8 * D, readings: [(-8 * D, 19.0, 60, 5)], now: now),
            Self.device("SEED-D5", "ネズミ", "Meter", temp: nil, hum: nil,
                        bat: nil, luOffset: nil, readings: [], now: now),
            Self.device("SEED-D6", "Tag <b>&</b>", "Meter Pro CO2", temp: 25.0,
                        hum: 40, bat: 100, luOffset: -1 * M, readings: [
                            (-1 * M, 25.0, 40, 100)], now: now),
        ]
        var devices: [MeterDevice] = []
        var histories: [String: [MeterReading]] = [:]
        for (d, rs) in all { devices.append(d); histories[d.deviceID] = rs }
        return (devices, histories)
    }

    func fetchMeters() async throws -> MetersResponse {
        let b = base()
        return MetersResponse(meters: b.devices,
                              lastUpdated: b.devices.compactMap(\.lastUpdated).max())
    }

    func fetchHistory(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse {
        let b = base()
        guard let device = b.devices.first(where: { $0.deviceID == deviceID }) else {
            throw MeterServiceError.http(status: 404, detail: "Device not found")
        }
        let cutoff = Date().addingTimeInterval(-timeScale.window)
        let history = (b.histories[deviceID] ?? [])
            .filter { $0.timestamp >= cutoff }
            .sorted { $0.timestamp < $1.timestamp }
        return HistoryResponse(deviceID: deviceID, timeScale: timeScale,
                               history: history, device: device)
    }

    func refresh() async throws -> RefreshResponse {
        RefreshResponse(status: "ok", message: "Data collection triggered",
                        metersCount: base().devices.count)
    }

    func fetchStatus() async throws -> ServiceStatus {
        ServiceStatus(configured: false, metersCount: base().devices.count,
                      isRateLimited: rateLimited,
                      backoffRemaining: rateLimited ? 120 : 0,
                      lastApiCall: 0, collectionInterval: 3600)
    }

    func healthCheck() async throws -> Bool { true }

    func fetchLatencyLogs(_ filter: LatencyLogFilter) async throws -> [LatencyLog] {
        let now = Date()
        var logs = [
            LatencyLog(id: 1, endpoint: "/devices", deviceID: nil,
                       timestamp: now.addingTimeInterval(-3600), latencyMs: 120.5,
                       statusCode: 200, success: true, errorMessage: nil),
            LatencyLog(id: 2, endpoint: "/devices/SEED-D1/status", deviceID: "SEED-D1",
                       timestamp: now.addingTimeInterval(-3000), latencyMs: 80.0,
                       statusCode: 200, success: true, errorMessage: nil),
            LatencyLog(id: 3, endpoint: "/devices/SEED-D2/status", deviceID: "SEED-D2",
                       timestamp: now.addingTimeInterval(-2400), latencyMs: 50.0,
                       statusCode: 429, success: false,
                       errorMessage: "Rate limited. Backing off for 120 seconds"),
            LatencyLog(id: 4, endpoint: "/devices/SEED-D3/status", deviceID: "SEED-D3",
                       timestamp: now.addingTimeInterval(-1800), latencyMs: 300.0,
                       statusCode: 500, success: false,
                       errorMessage: "Request error: timeout"),
        ]
        if let start = filter.start { logs = logs.filter { $0.timestamp >= start } }
        if let end = filter.end { logs = logs.filter { $0.timestamp <= end } }
        if let e = filter.endpoint, !e.isEmpty { logs = logs.filter { $0.endpoint == e } }
        if let d = filter.deviceID, !d.isEmpty { logs = logs.filter { $0.deviceID == d } }
        return Array(logs.sorted { $0.timestamp > $1.timestamp }.prefix(filter.limit))
    }

    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats {
        let logs = try await fetchLatencyLogs(
            LatencyLogFilter(start: start, end: end, limit: 100))
        guard !logs.isEmpty else {
            return LatencyStats(totalCalls: 0, avgLatencyMs: nil, minLatencyMs: nil,
                                maxLatencyMs: nil, successfulCalls: 0,
                                failedCalls: 0, successRate: 0)
        }
        let successes = logs.filter(\.success).count
        return LatencyStats(
            totalCalls: logs.count,
            avgLatencyMs: logs.map(\.latencyMs).reduce(0, +) / Double(logs.count),
            minLatencyMs: logs.map(\.latencyMs).min(),
            maxLatencyMs: logs.map(\.latencyMs).max(),
            successfulCalls: successes,
            failedCalls: logs.count - successes,
            successRate: Double(successes) / Double(logs.count) * 100)
    }

    func importData(_ data: ImportData) async throws -> ImportResult {
        for device in data.devices {
            if let lu = device.lastUpdated, JSONCoding.parse(lu) == nil {
                throw MeterServiceError.invalidImport("Invalid last_updated: \(lu)")
            }
            for r in device.readings where JSONCoding.parse(r.timestamp) == nil {
                throw MeterServiceError.invalidImport(
                    "Invalid reading timestamp: \(r.timestamp)")
            }
        }
        return ImportResult(status: "ok", importedDevices: data.devices.count,
                            importedReadings: data.devices.map(\.readings.count)
                                .reduce(0, +))
    }

    /// Writes a small valid SQLite file so the share sheet has something real.
    func exportBackup() async throws -> URL {
        let dest = FileManager.default.temporaryDirectory
            .appendingPathComponent(Self.backupFilename())
        try? FileManager.default.removeItem(at: dest)
        var db: OpaquePointer?
        sqlite3_open(dest.path, &db)
        sqlite3_exec(db, "CREATE TABLE devices (device_id TEXT PRIMARY KEY)", nil, nil, nil)
        sqlite3_close(db)
        return dest
    }
}
