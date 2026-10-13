import XCTest
@testable import TempMaster

final class RemoteMeterServiceTests: XCTestCase {
    override func tearDown() {
        URLProtocolStub.reset()
        super.tearDown()
    }

    private func service() throws -> RemoteMeterService {
        try RemoteMeterService(baseURL: "https://example.test/", session: URLProtocolStub.makeSession())
    }

    func testHistoryPathEncodingQueryAndDecode() async throws {
        URLProtocolStub.handler = { request in
            XCTAssertTrue(request.url!.absoluteString.contains("/api/meters/a%2Fb%20c/history"))
            XCTAssertEqual(URLComponents(url: request.url!, resolvingAgainstBaseURL: false)?.queryItems?.first?.value, "hour")
            return (200, [:], Data(#"{"history":[{"timestamp":"2024-01-02T03:04:05.123456Z","temperature":19,"humidity":40,"battery":88,"future":true}]}"#.utf8))
        }
        let result = try await service().fetchHistory(deviceId: "a/b c", timeScale: .hour)
        XCTAssertEqual(result.history.count, 1)
        XCTAssertEqual(result.history[0].temperature, 19)
    }

    func testHTTPErrorParsesBodyAndHeaderRequestIDs() async throws {
        URLProtocolStub.handler = { _ in
            (422, ["X-Request-ID": "header-id"], Data(#"{"detail":"bad payload","request_id":"body-id"}"#.utf8))
        }
        do {
            _ = try await service().fetchMeters()
            XCTFail("Expected HTTP error")
        } catch let error as ServiceError {
            XCTAssertEqual(error.errorDescription, "HTTP 422 - bad payload")
            guard case let .http(_, requestId, _) = error else { return XCTFail("Wrong error") }
            XCTAssertEqual(requestId, "body-id")
        }

        URLProtocolStub.handler = { _ in (500, ["X-Request-ID": "header-id"], Data("oops".utf8)) }
        do {
            _ = try await service().fetchMeters()
            XCTFail("Expected HTTP error")
        } catch let error as ServiceError {
            guard case let .http(_, requestId, _) = error else { return XCTFail("Wrong error") }
            XCTAssertEqual(requestId, "header-id")
        }
    }

    func testBackupErrorMessageFilenameAndDefault() async throws {
        URLProtocolStub.handler = { _ in
            (500, [:], Data(#"{"request_id":"0123456789ab"}"#.utf8))
        }
        do {
            _ = try await service().downloadBackup()
            XCTFail("Expected backup error")
        } catch let error as BackupError {
            XCTAssertEqual(error.userMessage, "Failed to download backup (HTTP 500). Request ID: 0123456789ab")
        }

        URLProtocolStub.handler = { _ in (500, [:], Data("{}".utf8)) }
        do {
            _ = try await service().downloadBackup()
            XCTFail("Expected backup error")
        } catch let error as BackupError {
            XCTAssertEqual(error.userMessage, "Failed to download backup (HTTP 500).")
        }

        URLProtocolStub.handler = { _ in (500, ["X-Request-ID": "header-backup-id"], Data("{}".utf8)) }
        do {
            _ = try await service().downloadBackup()
            XCTFail("Expected backup error")
        } catch let error as BackupError {
            XCTAssertEqual(error.userMessage, "Failed to download backup (HTTP 500). Request ID: header-backup-id")
        }

        URLProtocolStub.handler = { _ in throw URLError(.notConnectedToInternet) }
        do {
            _ = try await service().downloadBackup()
            XCTFail("Expected backup transport error")
        } catch let error as BackupError {
            XCTAssertTrue(error.userMessage.hasPrefix("Failed to download backup: "))
        }

        XCTAssertEqual(RemoteMeterService.backupFilename("attachment; filename=\"folder/data.db\""), "data.db")
        XCTAssertEqual(RemoteMeterService.backupFilename("attachment; filename=\"..\""), "switchbot_backup.db")
        XCTAssertEqual(RemoteMeterService.backupFilename(nil), "switchbot_backup.db")

        URLProtocolStub.handler = { _ in (200, ["Content-Disposition": "attachment; filename=data.db"], Data("db".utf8)) }
        let backup = try await service().downloadBackup()
        XCTAssertEqual(backup.filename, "data.db")
        XCTAssertEqual(try Data(contentsOf: backup.fileURL), Data("db".utf8))
        try? FileManager.default.removeItem(at: backup.fileURL.deletingLastPathComponent())

        URLProtocolStub.handler = { _ in (200, [:], Data("fallback".utf8)) }
        let defaultBackup = try await service().downloadBackup()
        XCTAssertEqual(defaultBackup.filename, "switchbot_backup.db")
        try? FileManager.default.removeItem(at: defaultBackup.fileURL.deletingLastPathComponent())
    }

    func testImportRejectsInvalidPayloadWithoutSendingRequest() async throws {
        URLProtocolStub.handler = { _ in (200, [:], Data(#"{"status":"ok","imported_devices":0,"imported_readings":0}"#.utf8)) }
        do {
            _ = try await service().importData(Data(#"{"devices":[{"device_id":"d","device_name":"D","device_type":"Meter","readings":[{"timestamp":"invalid","temperature":1,"humidity":2}]}]}"#.utf8))
            XCTFail("Expected local validation failure")
        } catch let error as ServiceError {
            guard case .invalidInput = error else { return XCTFail("Wrong error") }
        }
        XCTAssertEqual(URLProtocolStub.requestCount, 0)
    }

    func testImportSendsOriginalJSONAfterValidation() async throws {
        let payload = Data(#"{"devices":[],"unknown":true}"#.utf8)
        URLProtocolStub.handler = { request in
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
            XCTAssertEqual(URLProtocolStub.bodyData(for: request), payload)
            return (200, [:], Data(#"{"status":"ok","imported_devices":0,"imported_readings":0}"#.utf8))
        }
        let result = try await service().importData(payload)
        XCTAssertEqual(result.importedDevices, 0)
        XCTAssertEqual(URLProtocolStub.requestCount, 1)
    }

    func testRemoteQueryUsesUTCZTimestamp() async throws {
        let start = ISO8601Parsing.parse("2024-01-02T03:04:05.123456Z")!
        URLProtocolStub.handler = { request in
            let items = URLComponents(url: request.url!, resolvingAgainstBaseURL: false)!.queryItems!
            XCTAssertTrue(items.contains { $0.name == "start_time" && $0.value == "2024-01-02T03:04:05.123Z" })
            XCTAssertTrue(items.contains { $0.name == "limit" && $0.value == "100" })
            return (200, [:], Data(#"{"logs":[],"count":0}"#.utf8))
        }
        _ = try await service().fetchLatencyLogs(LatencyLogQuery(start: start))
    }
}
