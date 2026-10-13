import XCTest
@testable import TempMaster

private struct CollectionCredentials: CredentialsProviding {
    func read(account: String) -> String? { account == "token" ? "token" : "secret" }
    func save(_ value: String, account: String) throws {}
    func delete(account: String) throws {}
}

final class StandaloneMeterServiceTests: XCTestCase {
    override func tearDown() {
        URLProtocolStub.reset()
        super.tearDown()
    }

    private func service(handler: @escaping (URLRequest) throws -> (Int, [String: String], Data)) throws -> (StandaloneMeterService, SQLiteStore, URL) {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        URLProtocolStub.reset()
        URLProtocolStub.handler = handler
        let store = try SQLiteStore(url: folder.appendingPathComponent("app.db"))
        let service = StandaloneMeterService(
            store: store,
            credentials: CollectionCredentials(),
            session: URLProtocolStub.makeSession(),
            now: { Date(timeIntervalSince1970: 1_700_000_000) },
            switchBotBaseURL: URL(string: "https://switchbot.test/v1.1")!
        )
        return (service, store, folder)
    }

    func testCollectionFiltersTypesRecordsReadingsAndNilHumidityAsZero() async throws {
        let devices = #"{"statusCode":100,"body":{"deviceList":[{"deviceId":"d1","deviceName":"Meter","deviceType":"Meter","hubDeviceId":"hub"},{"deviceId":"d2","deviceName":"Hub","deviceType":"Hub 3"},{"deviceId":"skip","deviceName":"Curtain","deviceType":"Curtain"}]}}"#
        let (service, store, folder) = try service { request in
            if request.url!.path.hasSuffix("/devices") {
                return (200, [:], Data(devices.utf8))
            }
            if request.url!.path.hasSuffix("/d1/status") {
                return (200, [:], Data(#"{"statusCode":100,"body":{"temperature":19,"humidity":null,"battery":90}}"#.utf8))
            }
            return (200, [:], Data(#"{"statusCode":100,"body":{"temperature":null,"humidity":40,"battery":80}}"#.utf8))
        }
        defer {
            store.close()
            try? FileManager.default.removeItem(at: folder)
        }
        await service.collect()
        let meters = try store.allDevices()
        XCTAssertEqual(Set(meters.map(\.deviceId)), Set(["d1", "d2"]))
        let d1 = meters.first { $0.deviceId == "d1" }
        XCTAssertEqual(d1?.hubDeviceId, "hub")
        XCTAssertEqual(d1?.currentTemperature, 19)
        XCTAssertEqual(try store.readings(deviceId: "d1", since: .distantPast).first?.humidity, 0)
        XCTAssertTrue(try store.readings(deviceId: "d2", since: .distantPast).isEmpty)

        let backup = try await service.downloadBackup()
        XCTAssertTrue(backup.filename.range(of: #"^switchbot_backup_\d{8}_\d{6}\.db$"#, options: .regularExpression) != nil)
        XCTAssertEqual(String(data: try Data(contentsOf: backup.fileURL).prefix(16), encoding: .utf8), "SQLite format 3\u{0}")
        try? FileManager.default.removeItem(at: backup.fileURL.deletingLastPathComponent())
    }

    func testRateLimitStopsStatusLoopAndRecordsLatency() async throws {
        let devices = #"{"statusCode":100,"body":{"deviceList":[{"deviceId":"d1","deviceName":"One","deviceType":"Meter"},{"deviceId":"d2","deviceName":"Two","deviceType":"Meter"}]}}"#
        let (service, store, folder) = try service { request in
            if request.url!.path.hasSuffix("/devices") {
                return (200, [:], Data(devices.utf8))
            }
            return (429, [:], Data())
        }
        defer {
            store.close()
            try? FileManager.default.removeItem(at: folder)
        }
        await service.collect()
        XCTAssertEqual(URLProtocolStub.requestCount, 2)
        let logs = try store.latencyLogs(LatencyLogQuery())
        XCTAssertEqual(logs.count, 2)
        XCTAssertEqual(logs.first(where: { $0.statusCode == 429 })?.errorMessage, "Rate limited. Backing off for 120 seconds")
        let status = try await service.fetchStatus()
        XCTAssertTrue(status.isRateLimited)
        XCTAssertEqual(status.backoffRemaining, 120)
    }

    func testConcurrentCollectsShareOneDeviceListAndRecordOneReading() async throws {
        let devices = #"{"statusCode":100,"body":{"deviceList":[{"deviceId":"d1","deviceName":"One","deviceType":"Meter"}]}}"#
        let deviceRequestStarted = expectation(description: "device list request started")
        let deviceListCounter = LockedCounter()
        let (service, store, folder) = try service { request in
            if request.url!.path.hasSuffix("/devices") {
                deviceListCounter.increment()
                deviceRequestStarted.fulfill()
                Thread.sleep(forTimeInterval: 0.5)
                return (200, [:], Data(devices.utf8))
            }
            return (200, [:], Data(#"{"statusCode":100,"body":{"temperature":19,"humidity":40,"battery":90}}"#.utf8))
        }
        defer {
            store.close()
            try? FileManager.default.removeItem(at: folder)
        }

        let first = Task { await service.collect() }
        await fulfillment(of: [deviceRequestStarted], timeout: 5)
        let second = Task { await service.collect() }
        _ = await (first.value, second.value)

        XCTAssertEqual(deviceListCounter.value, 1)
        XCTAssertEqual(try store.readings(deviceId: "d1", since: .distantPast).count, 1)
    }

    func testRefreshSurfacesDeviceListFailureButTreatsRateLimitAsSuccess() async throws {
        let (failingService, store, folder) = try service { _ in
            (500, [:], Data("upstream unavailable".utf8))
        }
        defer {
            store.close()
            try? FileManager.default.removeItem(at: folder)
        }
        do {
            _ = try await failingService.refresh()
            XCTFail("Expected a transport error from the device list.")
        } catch let error as ServiceError {
            guard case .transport = error else { return XCTFail("Expected a transport error.") }
            XCTAssertEqual(error.errorDescription, "SwitchBot API error: upstream unavailable")
        }

        let (rateLimitedService, rateLimitedStore, rateLimitedFolder) = try service { _ in
            (429, [:], Data())
        }
        defer {
            rateLimitedStore.close()
            try? FileManager.default.removeItem(at: rateLimitedFolder)
        }
        let result = try await rateLimitedService.refresh()
        XCTAssertEqual(result.status, "ok")
        let rateLimitedStatus = try await rateLimitedService.fetchStatus()
        XCTAssertTrue(rateLimitedStatus.isRateLimited)
    }
}

private final class LockedCounter: @unchecked Sendable {
    private let lock = NSLock()
    private var storage = 0

    func increment() {
        lock.lock()
        storage += 1
        lock.unlock()
    }

    var value: Int {
        lock.lock()
        defer { lock.unlock() }
        return storage
    }
}
