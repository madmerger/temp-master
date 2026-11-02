import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
import XCTest
@testable import SwitchBotCore

final class APIClientTests: XCTestCase {
    func testHistoryEscapesDeviceIDAndAddsTimeScaleQuery() async throws {
        var capturedRequest: URLRequest?
        let api = client { request in
            capturedRequest = request
            return (200, Data(#"{"device_id":"meter /1","time_scale":"week","history":[],"device":null}"#.utf8))
        }

        let response = try await api.history(deviceID: "meter /1", timeScale: .week)
        XCTAssertEqual(response.timeScale, "week")
        let request = try XCTUnwrap(capturedRequest)
        let components = try XCTUnwrap(URLComponents(url: XCTUnwrap(request.url), resolvingAgainstBaseURL: false))
        XCTAssertEqual(components.percentEncodedPath, "/api/meters/meter%20%2F1/history")
        XCTAssertEqual(components.queryItems, [URLQueryItem(name: "time_scale", value: "week")])
    }

    func testRefreshUsesPost() async throws {
        var capturedRequest: URLRequest?
        let api = client { request in
            capturedRequest = request
            return (200, Data(#"{"status":"success","message":"ok","meters_count":2}"#.utf8))
        }

        let response = try await api.refresh()
        XCTAssertEqual(response.metersCount, 2)
        XCTAssertEqual(capturedRequest?.httpMethod, "POST")
        XCTAssertEqual(capturedRequest?.url?.path, "/api/meters/refresh")
    }

    func testFastAPIErrorDetailIsPreserved() async throws {
        let api = client { _ in
            (404, Data(#"{"detail":"Device not found"}"#.utf8))
        }

        do {
            _ = try await api.history(deviceID: "missing", timeScale: .hour)
            XCTFail("Expected an HTTP error.")
        } catch let error as DashboardAPIError {
            XCTAssertEqual(error, .http(status: 404, detail: "Device not found"))
            XCTAssertEqual(error.localizedDescription, "HTTP 404: Device not found")
        }
    }

    private func client(
        handler: @escaping (URLRequest) -> (Int, Data)
    ) -> URLSessionDashboardAPI {
        StubURLProtocol.handler = handler
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        return URLSessionDashboardAPI(
            baseURL: URL(string: "https://api.example.test")!,
            session: URLSession(configuration: configuration)
        )
    }
}

private final class StubURLProtocol: URLProtocol {
    static var handler: ((URLRequest) -> (Int, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = Self.handler else {
            client?.urlProtocol(self, didFailWithError: URLError(.badServerResponse))
            return
        }
        let (statusCode, data) = handler(request)
        let response = HTTPURLResponse(
            url: request.url!,
            statusCode: statusCode,
            httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": "application/json"]
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}
