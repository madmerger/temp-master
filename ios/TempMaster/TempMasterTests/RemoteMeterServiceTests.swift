import XCTest
@testable import TempMaster

final class RemoteMeterServiceTests: XCTestCase {
    private var requests: [URLRequest] = []

    private func makeService(
        handler: @escaping (URLRequest) throws -> (HTTPURLResponse, Data)
    ) -> RemoteMeterService {
        StubURLProtocol.handler = { req in
            self.requests.append(req)
            return try handler(req)
        }
        return RemoteMeterService(
            baseURL: URL(string: "http://localhost:8000")!,
            session: StubURLProtocol.session())
    }

    override func tearDown() {
        StubURLProtocol.handler = nil
        requests = []
    }

    func testEndpointPaths() async throws {
        let svc = makeService { req in
            (StubURLProtocol.response(url: req.url!), Data("{}".utf8))
        }
        StubURLProtocol.handler = { req in
            self.requests.append(req)
            let body: Data
            if req.url!.path.hasSuffix("/api/meters") {
                body = StubURLProtocol.json(["meters": [], "last_updated": nil])
            } else {
                body = Data("{}".utf8)
            }
            return (StubURLProtocol.response(url: req.url!), body)
        }
        _ = try await svc.fetchMeters()
        XCTAssertEqual(requests.last!.url!.path, "/api/meters")
        XCTAssertEqual(requests.last!.httpMethod, "GET")
    }

    func testHistoryQuery() async throws {
        StubURLProtocol.handler = { req in
            self.requests.append(req)
            return (StubURLProtocol.response(url: req.url!),
                    StubURLProtocol.json([
                        "device_id": "D1", "time_scale": "week",
                        "history": [], "device": nil]))
        }
        let svc = RemoteMeterService(baseURL: URL(string: "http://localhost:8000")!,
                                     session: StubURLProtocol.session())
        _ = try await svc.fetchHistory(deviceID: "D1", timeScale: .week)
        XCTAssertEqual(requests.last!.url!.path, "/api/meters/D1/history")
        XCTAssertTrue(requests.last!.url!.query!.contains("time_scale=week"))
    }

    func testRefreshIsPost() async throws {
        StubURLProtocol.handler = { req in
            self.requests.append(req)
            return (StubURLProtocol.response(url: req.url!),
                    StubURLProtocol.json([
                        "status": "ok", "message": "m", "meters_count": 1]))
        }
        let svc = RemoteMeterService(baseURL: URL(string: "http://localhost:8000")!,
                                     session: StubURLProtocol.session())
        _ = try await svc.refresh()
        XCTAssertEqual(requests.last!.httpMethod, "POST")
    }

    func testFastAPIDetailParsing() async throws {
        StubURLProtocol.handler = { req in
            (StubURLProtocol.response(url: req.url!, status: 500),
             StubURLProtocol.json(["detail": "SwitchBot credentials not configured"]))
        }
        let svc = RemoteMeterService(baseURL: URL(string: "http://localhost:8000")!,
                                     session: StubURLProtocol.session())
        do {
            _ = try await svc.refresh()
            XCTFail("expected throw")
        } catch MeterServiceError.http(let status, let detail) {
            XCTAssertEqual(status, 500)
            XCTAssertEqual(detail, "SwitchBot credentials not configured")
        }
    }

    func testImportBodySnakeCase() async throws {
        var capturedBody = Data()
        StubURLProtocol.handler = { req in
            self.requests.append(req)
            // URLProtocol receives the body via httpBodyStream, not httpBody.
            if let stream = req.httpBodyStream {
                stream.open()
                var buf = [UInt8](repeating: 0, count: 65536)
                let n = stream.read(&buf, maxLength: buf.count)
                if n > 0 { capturedBody = Data(buf.prefix(n)) }
                stream.close()
            }
            capturedBody = req.httpBody ?? capturedBody
            return (StubURLProtocol.response(url: req.url!),
                    StubURLProtocol.json([
                        "status": "ok", "imported_devices": 1,
                        "imported_readings": 2]))
        }
        let svc = RemoteMeterService(baseURL: URL(string: "http://localhost:8000")!,
                                     session: StubURLProtocol.session())
        let data = ImportData(devices: [
            ImportDeviceData(deviceID: "D1", deviceName: "n", deviceType: "Meter",
                             currentTemperature: 20.0, currentHumidity: 50,
                             lastUpdated: "2026-09-30T04:00:00Z")])
        _ = try await svc.importData(data)
        let obj = try JSONSerialization.jsonObject(with: capturedBody) as! [String: Any]
        let devices = obj["devices"] as! [[String: Any]]
        XCTAssertNotNil(devices[0]["device_id"])
        XCTAssertNotNil(devices[0]["device_name"])
        XCTAssertNotNil(devices[0]["last_updated"])
        XCTAssertNil(devices[0]["deviceID"])
    }

    func testLatencyLogsQueryItems() async throws {
        StubURLProtocol.handler = { req in
            self.requests.append(req)
            return (StubURLProtocol.response(url: req.url!),
                    StubURLProtocol.json(["logs": [], "count": 0]))
        }
        let svc = RemoteMeterService(baseURL: URL(string: "http://localhost:8000")!,
                                     session: StubURLProtocol.session())
        _ = try await svc.fetchLatencyLogs(
            LatencyLogFilter(endpoint: "/devices", deviceID: "D1", limit: 2))
        let q = requests.last!.url!.query ?? ""
        XCTAssertTrue(q.contains("endpoint="))
        XCTAssertTrue(q.contains("devices"))
        XCTAssertTrue(q.contains("device_id=D1"))
        XCTAssertTrue(q.contains("limit=2"))
    }
}
