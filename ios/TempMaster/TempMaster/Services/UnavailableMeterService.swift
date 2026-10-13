import Foundation

final class UnavailableMeterService: MeterService, @unchecked Sendable {
    private let error = ServiceError.invalidInput(L10n.text("invalid_backend_url"))

    func healthz() async throws -> HealthResponse { try unavailable() }
    func fetchMeters() async throws -> MetersResponse { try unavailable() }
    func fetchHistory(deviceId: String, timeScale: TimeScale) async throws -> HistoryResponse { try unavailable() }
    func refresh() async throws -> RefreshResponse { try unavailable() }
    func fetchStatus() async throws -> StatusResponse { try unavailable() }
    func fetchLatencyLogs(_ q: LatencyLogQuery) async throws -> LatencyLogsResponse { try unavailable() }
    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats { try unavailable() }
    func importData(_ json: Data) async throws -> ImportResult { try unavailable() }

    func downloadBackup() async throws -> BackupFile {
        throw BackupError(status: nil, requestId: nil, transportError: L10n.text("invalid_backend_url"))
    }

    private func unavailable<T>() throws -> T {
        throw error
    }
}
