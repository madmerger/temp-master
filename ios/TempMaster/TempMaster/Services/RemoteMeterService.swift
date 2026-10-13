import Foundation

final class RemoteMeterService: MeterService, @unchecked Sendable {
    private let session: URLSession
    private let baseURL: URL

    init(baseURL: String, session: URLSession = .shared) throws {
        let trimmed = baseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard BackendURLPolicy.isAllowed(trimmed),
              let url = URL(string: trimmed), url.scheme != nil, url.host != nil else {
            throw ServiceError.invalidInput(L10n.text("invalid_backend_url"))
        }
        self.baseURL = url
        self.session = session
    }

    static func encodedDeviceId(_ deviceId: String) -> String {
        deviceId.addingPercentEncoding(withAllowedCharacters: CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")) ?? deviceId
    }

    func healthz() async throws -> HealthResponse {
        try await get("/healthz")
    }

    func fetchMeters() async throws -> MetersResponse {
        try await get("/api/meters")
    }

    func fetchHistory(deviceId: String, timeScale: TimeScale) async throws -> HistoryResponse {
        try await get("/api/meters/\(Self.encodedDeviceId(deviceId))/history", query: [URLQueryItem(name: "time_scale", value: timeScale.rawValue)])
    }

    func refresh() async throws -> RefreshResponse {
        try await request("/api/meters/refresh", method: "POST")
    }

    func fetchStatus() async throws -> StatusResponse {
        try await get("/api/status")
    }

    func fetchLatencyLogs(_ q: LatencyLogQuery) async throws -> LatencyLogsResponse {
        var query = [URLQueryItem(name: "limit", value: String(q.limit))]
        if let start = q.start { query.append(URLQueryItem(name: "start_time", value: ISO8601Parsing.queryString(start))) }
        if let end = q.end { query.append(URLQueryItem(name: "end_time", value: ISO8601Parsing.queryString(end))) }
        if let endpoint = q.endpoint, !endpoint.isEmpty { query.append(URLQueryItem(name: "endpoint", value: endpoint)) }
        if let deviceId = q.deviceId, !deviceId.isEmpty { query.append(URLQueryItem(name: "device_id", value: deviceId)) }
        return try await get("/api/latency-logs", query: query)
    }

    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats {
        var query: [URLQueryItem] = []
        if let start { query.append(URLQueryItem(name: "start_time", value: ISO8601Parsing.queryString(start))) }
        if let end { query.append(URLQueryItem(name: "end_time", value: ISO8601Parsing.queryString(end))) }
        return try await get("/api/latency-stats", query: query)
    }

    func importData(_ json: Data) async throws -> ImportResult {
        let payload: ImportPayload
        do {
            payload = try JSONDecoder().decode(ImportPayload.self, from: json)
            for device in payload.devices {
                if let raw = device.lastUpdated, ISO8601Parsing.parse(raw) == nil {
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
        _ = payload
        var request = URLRequest(url: makeURL(path: "/api/import"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = json
        return try await execute(request)
    }

    func downloadBackup() async throws -> BackupFile {
        let request = URLRequest(url: makeURL(path: "/api/backup"))
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw BackupError(status: nil, requestId: nil, transportError: error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else {
            throw BackupError(status: nil, requestId: nil, transportError: L10n.text("invalid_response"))
        }
        guard (200..<300).contains(http.statusCode) else {
            let details = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            let requestId = details?["request_id"] as? String ?? http.value(forHTTPHeaderField: "X-Request-ID")
            throw BackupError(status: http.statusCode, requestId: requestId, transportError: nil)
        }
        let filename = Self.backupFilename(http.value(forHTTPHeaderField: "Content-Disposition"))
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        do {
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let file = folder.appendingPathComponent(filename)
            try data.write(to: file, options: .atomic)
            return BackupFile(fileURL: file, filename: filename)
        } catch {
            try? FileManager.default.removeItem(at: folder)
            throw BackupError(status: nil, requestId: nil, transportError: error.localizedDescription)
        }
    }

    static func backupFilename(_ disposition: String?) -> String {
        var filename = "switchbot_backup.db"
        if let disposition,
           let range = disposition.range(of: #"filename="?([^";]+)"?"#, options: .regularExpression) {
            let match = String(disposition[range])
            filename = match.replacingOccurrences(of: #"^filename="?|"?$"#, with: "", options: .regularExpression)
        }
        filename = (filename as NSString).lastPathComponent
        if filename.isEmpty || filename == "." || filename == ".." { return "switchbot_backup.db" }
        return filename
    }

    private func get<T: Decodable>(_ path: String, query: [URLQueryItem] = []) async throws -> T {
        try await execute(URLRequest(url: makeURL(path: path, query: query)))
    }

    private func makeURL(path: String, query: [URLQueryItem] = []) -> URL {
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
        let basePath = components.percentEncodedPath.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let endpointPath = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let pathParts = [basePath, endpointPath].filter { !$0.isEmpty }
        components.percentEncodedPath = "/" + pathParts.joined(separator: "/")
        components.queryItems = query.isEmpty ? nil : query
        components.fragment = nil
        return components.url!
    }

    private func request<T: Decodable>(_ path: String, method: String) async throws -> T {
        var request = URLRequest(url: makeURL(path: path))
        request.httpMethod = method
        return try await execute(request)
    }

    private func execute<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw ServiceError.transport(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else {
            throw ServiceError.transport(L10n.text("invalid_response"))
        }
        guard (200..<300).contains(http.statusCode) else {
            let body = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            let detail = body?["detail"] as? String
            let requestId = body?["request_id"] as? String ?? http.value(forHTTPHeaderField: "X-Request-ID")
            throw ServiceError.http(status: http.statusCode, requestId: requestId, detail: detail)
        }
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw ServiceError.decoding(error.localizedDescription)
        }
    }
}
