import Foundation

enum ServiceError: Error, LocalizedError, Sendable {
    case http(status: Int, requestId: String?, detail: String?)
    case transport(String)
    case decoding(String)
    case notConfigured
    case invalidInput(String)

    var errorDescription: String? {
        switch self {
        case let .http(status, _, detail):
            return "HTTP \(status)" + (detail.map { " - \($0)" } ?? "")
        case let .transport(message), let .decoding(message), let .invalidInput(message):
            return message
        case .notConfigured:
            return L10n.text("not_configured")
        }
    }
}

struct BackupError: Error, LocalizedError, Sendable {
    let status: Int?
    let requestId: String?
    let transportError: String?

    var userMessage: String {
        if let status {
            if let requestId {
                return L10n.format("backup_http_request_id", status, requestId)
            }
            return L10n.format("backup_http", status)
        }
        return L10n.format("backup_transport", transportError ?? "")
    }
    var errorDescription: String? { userMessage }
}

protocol MeterService: AnyObject, Sendable {
    func healthz() async throws -> HealthResponse
    func fetchMeters() async throws -> MetersResponse
    func fetchHistory(deviceId: String, timeScale: TimeScale) async throws -> HistoryResponse
    func refresh() async throws -> RefreshResponse
    func fetchStatus() async throws -> StatusResponse
    func fetchLatencyLogs(_ q: LatencyLogQuery) async throws -> LatencyLogsResponse
    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats
    func importData(_ json: Data) async throws -> ImportResult
    func downloadBackup() async throws -> BackupFile
}
