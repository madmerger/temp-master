import Foundation

enum MeterServiceError: LocalizedError, Equatable {
    case http(status: Int, detail: String)
    case transport(String)
    case notConfigured
    case rateLimited(retryAfter: Int)
    case invalidResponse
    case decoding(String)
    case invalidImport(String)

    var errorDescription: String? {
        switch self {
        case .http(let status, let detail):
            return detail.isEmpty ? "HTTP \(status)" : "HTTP \(status): \(detail)"
        case .transport(let msg): return msg
        case .notConfigured: return "SwitchBot credentials not configured"
        case .rateLimited(let retryAfter):
            return "Rate limited. Retry after \(retryAfter) seconds"
        case .invalidResponse: return "Invalid response"
        case .decoding(let msg): return "Decoding error: \(msg)"
        case .invalidImport(let msg): return msg
        }
    }
}

protocol MeterService: Sendable {
    func fetchMeters() async throws -> MetersResponse
    func fetchHistory(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse
    func refresh() async throws -> RefreshResponse
    func fetchStatus() async throws -> ServiceStatus
    func healthCheck() async throws -> Bool
    func fetchLatencyLogs(_ filter: LatencyLogFilter) async throws -> [LatencyLog]
    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats
    func importData(_ data: ImportData) async throws -> ImportResult
    /// Local temp file named switchbot_backup_YYYYMMDD_HHMMSS.db (UTC). B-10
    func exportBackup() async throws -> URL
}

/// Percent-encodes a value for use as a single URL path segment
/// (encodes "/", "?", "#", "%", spaces, etc.) — same role as the
/// legacy frontend's encodeURIComponent.
enum PathSegment {
    static func encode(_ value: String) -> String {
        var allowed = CharacterSet.urlPathAllowed
        allowed.remove(charactersIn: "%/?#")
        return value.addingPercentEncoding(withAllowedCharacters: allowed) ?? value
    }
}

extension MeterService {
    static func backupFilename(now: Date = Date()) -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(secondsFromGMT: 0)!
        let c = cal.dateComponents([.year, .month, .day, .hour, .minute, .second], from: now)
        return String(format: "switchbot_backup_%04d%02d%02d_%02d%02d%02d.db",
                      c.year!, c.month!, c.day!, c.hour!, c.minute!, c.second!)
    }
}
