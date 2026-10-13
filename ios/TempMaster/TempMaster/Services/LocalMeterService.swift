import Foundation

/// Standalone mode: the backend role runs on-device — SwitchBot Cloud API
/// via SwitchBotClient + local SQLiteStore.
final class LocalMeterService: MeterService, @unchecked Sendable {
    static let collectionInterval: Int = 3600

    let store: SQLiteStore
    let client: SwitchBotClient
    let collector: DataCollector
    private var collectionTask: Task<Void, Never>?

    init(store: SQLiteStore, client: SwitchBotClient) {
        self.store = store
        self.client = client
        self.collector = DataCollector(client: client, store: store)
    }

    deinit { collectionTask?.cancel() }

    /// Periodic collection while the app is active (3600 s), mirroring
    /// background_collector. Only runs when credentials exist.
    func startPeriodicCollection() {
        collectionTask?.cancel()
        collectionTask = Task { [collector] in
            while !Task.isCancelled {
                await collector.collect()
                try? await Task.sleep(for: .seconds(Self.collectionInterval))
            }
        }
    }

    func stopPeriodicCollection() {
        collectionTask?.cancel()
        collectionTask = nil
    }

    /// B-17: readings >1y, latency logs >30d.
    func cleanupOldData(now: Date = Date()) throws {
        try store.deleteReadings(olderThan: now.addingTimeInterval(-31536000))
        try store.deleteLatencyLogs(olderThan: now.addingTimeInterval(-2592000))
    }

    // MARK: - MeterService

    func fetchMeters() async throws -> MetersResponse {
        let devices = store.allDevices()
        return MetersResponse(
            meters: devices,
            lastUpdated: devices.compactMap(\.lastUpdated).max())
    }

    func fetchHistory(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse {
        guard let device = store.device(deviceID) else {
            throw MeterServiceError.http(status: 404, detail: "Device not found")
        }
        let cutoff = Date().addingTimeInterval(-timeScale.window)
        return HistoryResponse(
            deviceID: deviceID,
            timeScale: timeScale,
            history: store.readings(deviceID: deviceID, since: cutoff),
            device: device)
    }

    func refresh() async throws -> RefreshResponse {
        guard client.credentials() != nil else {
            throw MeterServiceError.notConfigured
        }
        await collector.collect()
        return RefreshResponse(
            status: "ok",
            message: "Data collection triggered",
            metersCount: store.allDevices().count)
    }

    func fetchStatus() async throws -> ServiceStatus {
        ServiceStatus(
            configured: client.credentials() != nil,
            metersCount: store.allDevices().count,
            isRateLimited: client.isRateLimited,
            backoffRemaining: client.backoffRemaining,
            lastApiCall: client.lastAPICall,
            collectionInterval: Self.collectionInterval)
    }

    func healthCheck() async throws -> Bool { true }

    func fetchLatencyLogs(_ filter: LatencyLogFilter) async throws -> [LatencyLog] {
        store.latencyLogs(filter)
    }

    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats {
        store.latencyStats(start: start, end: end)
    }

    func importData(_ data: ImportData) async throws -> ImportResult {
        try store.importData(data)
    }

    func exportBackup() async throws -> URL {
        let dest = FileManager.default.temporaryDirectory
            .appendingPathComponent(Self.backupFilename())
        try store.makeBackup(to: dest)
        return dest
    }
}
