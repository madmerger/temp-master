import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public protocol DashboardAPI: Sendable {
    func meters() async throws -> MetersResponse
    func status() async throws -> StatusResponse
    func history(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse
    func refresh() async throws -> RefreshResponse
}

public enum DashboardAPIError: Error, Equatable, LocalizedError, Sendable {
    case http(status: Int, detail: String?)

    public var errorDescription: String? {
        switch self {
        case let .http(status, detail):
            if let detail, !detail.isEmpty {
                return "HTTP \(status): \(detail)"
            }
            return "HTTP \(status)"
        }
    }
}

public final class URLSessionDashboardAPI: DashboardAPI, @unchecked Sendable {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func meters() async throws -> MetersResponse {
        return try await send(path: "/api/meters")
    }

    public func status() async throws -> StatusResponse {
        return try await send(path: "/api/status")
    }

    public func history(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse {
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")
        guard let escapedID = deviceID.addingPercentEncoding(withAllowedCharacters: allowed) else {
            throw URLError(.badURL)
        }
        return try await send(
            path: "/api/meters/\(escapedID)/history",
            queryItems: [URLQueryItem(name: "time_scale", value: timeScale.rawValue)]
        )
    }

    public func refresh() async throws -> RefreshResponse {
        return try await send(path: "/api/meters/refresh", method: "POST")
    }

    private func send<Response: Decodable>(
        path: String,
        method: String = "GET",
        queryItems: [URLQueryItem] = []
    ) async throws -> Response {
        var request = URLRequest(url: try makeURL(path: path, queryItems: queryItems))
        request.httpMethod = method
        let (data, response) = try await data(for: request)
        guard let response = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        guard (200..<300).contains(response.statusCode) else {
            let body = try? JSONDecoder().decode(APIErrorBody.self, from: data)
            throw DashboardAPIError.http(status: response.statusCode, detail: body?.detail)
        }
        return try DashboardJSON.decoder().decode(Response.self, from: data)
    }

    private func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        try await withCheckedThrowingContinuation {
            (continuation: CheckedContinuation<(Data, URLResponse), Error>) in
            let task = session.dataTask(with: request) { data, response, error in
                if let error {
                    continuation.resume(throwing: error)
                } else if let data, let response {
                    continuation.resume(returning: (data, response))
                } else {
                    continuation.resume(throwing: URLError(.badServerResponse))
                }
            }
            task.resume()
        }
    }

    private func makeURL(path: String, queryItems: [URLQueryItem]) throws -> URL {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            throw URLError(.badURL)
        }
        let prefix = components.percentEncodedPath.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        components.percentEncodedPath = "/\(prefix)\(prefix.isEmpty ? "" : "/")\(path.dropFirst())"
        components.queryItems = queryItems.isEmpty ? nil : queryItems
        guard let url = components.url else {
            throw URLError(.badURL)
        }
        return url
    }

    private struct APIErrorBody: Decodable {
        let detail: String?
    }
}
