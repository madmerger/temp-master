import Foundation

/// Remote mode: maps 1:1 to the legacy FastAPI backend endpoints.
struct RemoteMeterService: MeterService {
    let baseURL: URL
    let session: URLSession

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    // MARK: - request helpers

    private func get<T: Decodable>(_ path: String,
                                   query: [URLQueryItem] = []) async throws -> T {
        let (data, response) = try await dataTask(path: path, query: query)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw Self.httpError(data: data, response: response)
        }
        do {
            return try JSONCoding.decoder().decode(T.self, from: data)
        } catch {
            throw MeterServiceError.decoding("\(error)")
        }
    }

    private func post<T: Decodable, B: Encodable>(_ path: String,
                                                body: B?) async throws -> T {
        let (data, response) = try await dataTask(path: path, method: "POST", body: body)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw Self.httpError(data: data, response: response)
        }
        do {
            return try JSONCoding.decoder().decode(T.self, from: data)
        } catch {
            throw MeterServiceError.decoding("\(error)")
        }
    }

    private func dataTask(path: String, query: [URLQueryItem] = []) async throws -> (Data, URLResponse) {
        var comps = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { comps.queryItems = query }
        var request = URLRequest(url: comps.url!)
        request.httpMethod = "GET"
        do {
            return try await session.data(for: request)
        } catch {
            throw MeterServiceError.transport(error.localizedDescription)
        }
    }

    private func dataTask<B: Encodable>(path: String, method: String,
                                        body: B?) async throws -> (Data, URLResponse) {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let body {
            request.httpBody = try JSONCoding.encoder().encode(body)
        }
        do {
            return try await session.data(for: request)
        } catch {
            throw MeterServiceError.transport(error.localizedDescription)
        }
    }

    /// FastAPI errors are `{"detail": ...}` (string or object).
    private static func httpError(data: Data, response: URLResponse) -> Error {
        let status = (response as? HTTPURLResponse)?.statusCode ?? -1
        var detail = String(data: data, encoding: .utf8) ?? ""
        if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let d = obj["detail"] {
            detail = (d as? String) ?? String(describing: d)
        }
        return MeterServiceError.http(status: status, detail: detail)
    }

    // MARK: - MeterService

    func fetchMeters() async throws -> MetersResponse {
        try await get("/api/meters")
    }

    func fetchHistory(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse {
        try await get("/api/meters/\(deviceID)/history",
                      query: [URLQueryItem(name: "time_scale", value: timeScale.rawValue)])
    }

    private struct EmptyBody: Encodable {}

    func refresh() async throws -> RefreshResponse {
        try await post("/api/meters/refresh", body: nil as EmptyBody?)
    }

    func fetchStatus() async throws -> ServiceStatus {
        try await get("/api/status")
    }

    func healthCheck() async throws -> Bool {
        struct Health: Decodable { let status: String }
        let h: Health = try await get("/healthz")
        return h.status == "ok"
    }

    func fetchLatencyLogs(_ filter: LatencyLogFilter) async throws -> [LatencyLog] {
        struct Response: Decodable { let logs: [LatencyLog]; let count: Int }
        var query: [URLQueryItem] = []
        if let start = filter.start {
            query.append(URLQueryItem(name: "start_time", value: JSONCoding.format(start)))
        }
        if let end = filter.end {
            query.append(URLQueryItem(name: "end_time", value: JSONCoding.format(end)))
        }
        if let endpoint = filter.endpoint, !endpoint.isEmpty {
            query.append(URLQueryItem(name: "endpoint", value: endpoint))
        }
        if let deviceID = filter.deviceID, !deviceID.isEmpty {
            query.append(URLQueryItem(name: "device_id", value: deviceID))
        }
        query.append(URLQueryItem(name: "limit", value: "\(filter.limit)"))
        let resp: Response = try await get("/api/latency-logs", query: query)
        return resp.logs
    }

    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats {
        var query: [URLQueryItem] = []
        if let start {
            query.append(URLQueryItem(name: "start_time", value: JSONCoding.format(start)))
        }
        if let end {
            query.append(URLQueryItem(name: "end_time", value: JSONCoding.format(end)))
        }
        return try await get("/api/latency-stats", query: query)
    }

    func importData(_ data: ImportData) async throws -> ImportResult {
        try await post("/api/import", body: data)
    }

    /// B-10: download /api/backup to a temp file; filename from
    /// Content-Disposition when present, else generated.
    func exportBackup() async throws -> URL {
        let request = URLRequest(url: baseURL.appendingPathComponent("/api/backup"))
        let (tmp, response): (URL, URLResponse)
        do {
            (tmp, response) = try await session.download(for: request)
        } catch {
            throw MeterServiceError.transport(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let data = (try? Data(contentsOf: tmp)) ?? Data()
            throw Self.httpError(data: data, response: response)
        }
        var filename = Self.backupFilename()
        if let cd = http.value(forHTTPHeaderField: "Content-Disposition"),
           let m = cd.range(of: #"filename="?([^";]+)"?"#,
                            options: .regularExpression) {
            filename = String(cd[m].replacingOccurrences(of: "filename=", with: "")
                                .replacingOccurrences(of: "\"", with: ""))
        }
        let dest = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        try? FileManager.default.removeItem(at: dest)
        try FileManager.default.moveItem(at: tmp, to: dest)
        return dest
    }
}
