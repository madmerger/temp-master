import XCTest
@testable import TempMaster

private final class FakeMeterService: MeterService, @unchecked Sendable {
    var meterResponse = MetersResponse(meters: [], lastUpdated: nil)
    var statusResponse = StatusResponse(configured: true, metersCount: 0, isRateLimited: false, backoffRemaining: 0, lastApiCall: nil, collectionInterval: 3600)
    var meterError: Error?
    var statusError: Error?
    var refreshError: Error?
    var backupError: Error?
    var historyCalls: [(String, TimeScale)] = []

    func healthz() async throws -> HealthResponse { HealthResponse(status: "ok") }
    func fetchMeters() async throws -> MetersResponse {
        if let meterError { throw meterError }
        return meterResponse
    }
    func fetchHistory(deviceId: String, timeScale: TimeScale) async throws -> HistoryResponse {
        historyCalls.append((deviceId, timeScale))
        return HistoryResponse(history: [])
    }
    func refresh() async throws -> RefreshResponse {
        if let refreshError { throw refreshError }
        return RefreshResponse(status: "ok", message: "Data collection triggered", metersCount: meterResponse.meters.count)
    }
    func fetchStatus() async throws -> StatusResponse {
        if let statusError { throw statusError }
        return statusResponse
    }
    func fetchLatencyLogs(_ q: LatencyLogQuery) async throws -> LatencyLogsResponse { LatencyLogsResponse(logs: [], count: 0) }
    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats { .empty }
    func importData(_ json: Data) async throws -> ImportResult { ImportResult(status: "ok", importedDevices: 0, importedReadings: 0) }
    func downloadBackup() async throws -> BackupFile {
        if let backupError { throw backupError }
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try Data().write(to: file)
        return BackupFile(fileURL: file, filename: file.lastPathComponent)
    }
}

@MainActor
final class DashboardViewModelTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 1_800_000_000)

    func testSuccessSplitsStaleMetersAndFetchesOnlyActiveHistory() async {
        let service = FakeMeterService()
        service.meterResponse = MetersResponse(meters: [
            MeterDevice(deviceId: "active", deviceName: "Active", deviceType: "Meter", currentTemperature: 19, lastUpdatedRaw: ISO8601Parsing.encode(now)),
            MeterDevice(deviceId: "stale", deviceName: "Stale", deviceType: "Meter", lastUpdatedRaw: "invalid"),
            MeterDevice(deviceId: "no-date", deviceName: "No date", deviceType: "Meter")
        ], lastUpdated: nil)
        service.statusResponse = StatusResponse(configured: true, metersCount: 1, isRateLimited: false, backoffRemaining: 0, lastApiCall: nil, collectionInterval: 3600)
        let viewModel = DashboardViewModel(service: service, now: { self.now })
        await viewModel.fetchData()
        XCTAssertEqual(viewModel.activeMeters.map(\.deviceId), ["active"])
        XCTAssertEqual(Set(viewModel.staleMeters.map(\.deviceId)), ["stale", "no-date"])
        XCTAssertEqual(service.historyCalls.map(\.0), ["active"])
        XCTAssertTrue(viewModel.isConnected)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testSlowOldRangeHistoryCannotOverwriteNewRangeOrRestoreInactiveMeters() async {
        let gate = HistoryGate()
        let service = DelayedHistoryService(gate: gate)
        let keep = MeterDevice(
            deviceId: "keep",
            deviceName: "Keep",
            deviceType: "Meter",
            lastUpdatedRaw: ISO8601Parsing.encode(now)
        )
        let removed = MeterDevice(
            deviceId: "removed",
            deviceName: "Removed",
            deviceType: "Meter",
            lastUpdatedRaw: ISO8601Parsing.encode(now)
        )
        await service.setDevices([keep, removed])
        let viewModel = DashboardViewModel(service: service, now: { self.now })

        let oldFetch = Task { await viewModel.fetchData() }
        await gate.waitUntilStarted()
        await viewModel.setTimeScale(.hour)
        await service.setDevices([keep])
        await viewModel.fetchData()
        await gate.open()
        await oldFetch.value

        XCTAssertEqual(Set(viewModel.histories.keys), ["keep"])
        XCTAssertEqual(viewModel.histories["keep"]?.first?.temperature, 2)
    }

    func testMeterAndStatusFailuresSetLegacyMessagesAndDisconnect() async {
        let meterFailure = FakeMeterService()
        meterFailure.meterError = ServiceError.transport("offline")
        let meterModel = DashboardViewModel(service: meterFailure)
        await meterModel.fetchData()
        XCTAssertEqual(meterModel.errorMessage, "Failed to fetch meters: offline")
        XCTAssertFalse(meterModel.isConnected)

        let statusFailure = FakeMeterService()
        statusFailure.statusError = ServiceError.transport("offline")
        let statusModel = DashboardViewModel(service: statusFailure)
        await statusModel.fetchData()
        XCTAssertEqual(statusModel.errorMessage, "Failed to fetch status: offline")
        XCTAssertFalse(statusModel.isConnected)
    }

    func testRefreshFailureClearsAfterSuccessfulFetchAndRangeChangeRefetches() async {
        let service = FakeMeterService()
        service.meterResponse = MetersResponse(meters: [
            MeterDevice(deviceId: "d1", deviceName: "One", deviceType: "Meter", lastUpdatedRaw: ISO8601Parsing.encode(now))
        ], lastUpdated: nil)
        service.refreshError = ServiceError.transport("offline")
        let viewModel = DashboardViewModel(service: service, now: { self.now })
        await viewModel.refresh()
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertTrue(viewModel.isConnected)
        XCTAssertFalse(viewModel.isRefreshing)
        XCTAssertEqual(service.historyCalls.count, 1)
        await viewModel.setTimeScale(.hour)
        XCTAssertEqual(service.historyCalls.count, 2)
        XCTAssertEqual(service.historyCalls.last?.1, .hour)
    }

    func testBackupErrorDisconnectsAndStatusCountLocalizesSingularPlural() async {
        let service = FakeMeterService()
        service.backupError = BackupError(status: 500, requestId: "0123456789ab", transportError: nil)
        let viewModel = DashboardViewModel(service: service)
        await viewModel.downloadBackup()
        XCTAssertEqual(viewModel.errorMessage, "Failed to download backup (HTTP 500). Request ID: 0123456789ab")
        XCTAssertFalse(viewModel.isConnected)

        service.statusResponse = StatusResponse(configured: true, metersCount: 1, isRateLimited: false, backoffRemaining: 0, lastApiCall: nil, collectionInterval: 3600)
        await viewModel.fetchData()
        XCTAssertEqual(viewModel.statusCountText, "Monitoring 1 meter")
        service.statusResponse = StatusResponse(configured: true, metersCount: 2, isRateLimited: false, backoffRemaining: 0, lastApiCall: nil, collectionInterval: 3600)
        await viewModel.fetchData()
        XCTAssertEqual(viewModel.statusCountText, "Monitoring 2 meters")
    }

    func testFinishSharingBackupDeletesDirectoryAndIsIdempotent() throws {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: folder) }
        let fileURL = folder.appendingPathComponent("backup.db")
        try Data("backup".utf8).write(to: fileURL)
        let viewModel = DashboardViewModel(service: FakeMeterService())
        viewModel.backupFile = BackupFile(fileURL: fileURL, filename: fileURL.lastPathComponent)

        viewModel.finishSharingBackup()
        XCTAssertNil(viewModel.backupFile)
        XCTAssertFalse(FileManager.default.fileExists(atPath: folder.path))
        viewModel.finishSharingBackup()
        XCTAssertNil(viewModel.backupFile)
    }
}

@MainActor
final class SettingsValidationTests: XCTestCase {
    func testCustomBackendURLPolicy() {
        XCTAssertTrue(SettingsViewModel.isAllowedBackendURL("https://example.com"))
        XCTAssertTrue(SettingsViewModel.isAllowedBackendURL("https://example.com/prefix"))
        XCTAssertTrue(SettingsViewModel.isAllowedBackendURL("https://localhost:8443"))
        XCTAssertTrue(SettingsViewModel.isAllowedBackendURL("http://localhost:8080"))
        XCTAssertTrue(SettingsViewModel.isAllowedBackendURL("http://127.0.0.1:8000"))
        XCTAssertFalse(SettingsViewModel.isAllowedBackendURL("http://example.com"))
        XCTAssertFalse(SettingsViewModel.isAllowedBackendURL("http://[::1]"))
        XCTAssertFalse(SettingsViewModel.isAllowedBackendURL("file:///tmp/data"))
        XCTAssertFalse(SettingsViewModel.isAllowedBackendURL("https://example.com?mode=test"))
        XCTAssertFalse(SettingsViewModel.isAllowedBackendURL("https://example.com/path#section"))
        XCTAssertFalse(SettingsViewModel.isAllowedBackendURL("https://user:password@example.com"))
    }

    func testMockSettingsDoNotTouchKeychain() {
        let credentials = CountingCredentials()
        let environment = AppEnvironment(arguments: ["-UITestMockData"], keychain: credentials)
        _ = SettingsViewModel(environment: environment)
        XCTAssertEqual(credentials.readCount, 0)
        XCTAssertTrue(environment.isMockMode)
    }

    func testMockBackendSelectionStaysLocalAndConnectionUsesMockService() async {
        let credentials = CountingCredentials()
        let environment = AppEnvironment(arguments: ["-UITestMockData"], keychain: credentials)
        let viewModel = SettingsViewModel(environment: environment)
        viewModel.customURL = "https://example.com"
        viewModel.selectBackend(.custom)

        XCTAssertEqual(viewModel.backendChoice, .custom)
        await viewModel.testConnection()
        XCTAssertEqual(viewModel.connectionTestResult, "OK (status: ok)")
        XCTAssertEqual(credentials.readCount, 0)
    }

    func testApplyingCustomURLTrimsWhitespaceAndPersistsTrimmedValue() async {
        let suiteName = "TempMasterTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        let statusRequest = expectation(description: "custom backend status reload")
        URLProtocolStub.handler = { _ in
            statusRequest.fulfill()
            return (200, [:], Data(#"{"configured":false,"meters_count":0,"is_rate_limited":false,"backoff_remaining":0,"last_api_call":null,"collection_interval":3600}"#.utf8))
        }
        defer {
            URLProtocolStub.reset()
            defaults.removePersistentDomain(forName: suiteName)
        }
        let environment = AppEnvironment(
            arguments: [],
            defaults: defaults,
            keychain: CountingCredentials(),
            session: URLProtocolStub.makeSession()
        )
        let viewModel = SettingsViewModel(environment: environment)
        let trimmedURL = "https://example.test/prefix"
        viewModel.customURL = " \n\(trimmedURL)\n "

        viewModel.applyCustomURL()
        await fulfillment(of: [statusRequest], timeout: 5)

        XCTAssertEqual(viewModel.customURL, trimmedURL)
        XCTAssertEqual(environment.backendURL, trimmedURL)
        XCTAssertEqual(environment.customBackendURL, trimmedURL)
        XCTAssertEqual(defaults.string(forKey: "customBackendURL"), trimmedURL)
        XCTAssertTrue(defaults.bool(forKey: "usesCustomBackend"))
    }

    func testInvalidPersistedCustomURLFallsBackToProduction() {
        let suiteName = "TempMasterTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        defaults.set(true, forKey: "usesCustomBackend")
        defaults.set("http://example.com", forKey: "customBackendURL")

        let environment = AppEnvironment(arguments: [], defaults: defaults)

        XCTAssertEqual(environment.backendURL, AppEnvironment.productionBackendURL)
        XCTAssertFalse(environment.usesCustomBackend)
        XCTAssertFalse(defaults.bool(forKey: "usesCustomBackend"))
    }

    func testSavingStandaloneCredentialsCollectsAndReloadsDashboard() async throws {
        let suiteName = "TempMasterTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            URLProtocolStub.reset()
            defaults.removePersistentDomain(forName: suiteName)
        }
        defaults.set(DataSource.standalone.rawValue, forKey: "dataSource")
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let store = try SQLiteStore(url: folder.appendingPathComponent("app.db"))
        defer {
            store.close()
            try? FileManager.default.removeItem(at: folder)
        }
        let devicesRequest = expectation(description: "credentials trigger collection")
        let dashboardReload = expectation(forNotification: AppEnvironment.dashboardReloadNotification, object: nil)
        URLProtocolStub.handler = { request in
            XCTAssertTrue(request.url!.path.hasSuffix("/devices"))
            devicesRequest.fulfill()
            return (200, [:], Data(#"{"statusCode":100,"body":{"deviceList":[]}}"#.utf8))
        }
        let credentials = MemoryCredentials()
        let environment = AppEnvironment(
            arguments: [],
            defaults: defaults,
            keychain: credentials,
            session: URLProtocolStub.makeSession(),
            storeFactory: { store }
        )
        let viewModel = SettingsViewModel(environment: environment)
        viewModel.token = "token-value"
        viewModel.secret = "secret-value"
        viewModel.saveCredentials()

        await fulfillment(of: [devicesRequest, dashboardReload], timeout: 5)
        XCTAssertEqual(credentials.read(account: "token"), "token-value")
        XCTAssertEqual(credentials.read(account: "secret"), "secret-value")
    }

    func testInvalidStoredBackendFallsBackToProductionAndClearsFlag() {
        let suiteName = "TempMasterTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.set(true, forKey: "usesCustomBackend")
        defaults.set("not a URL", forKey: "customBackendURL")
        defer { defaults.removePersistentDomain(forName: suiteName) }

        let environment = AppEnvironment(arguments: [], defaults: defaults)

        XCTAssertEqual(environment.backendURL, AppEnvironment.productionBackendURL)
        XCTAssertFalse(environment.usesCustomBackend)
        XCTAssertFalse(defaults.bool(forKey: "usesCustomBackend"))
    }

    func testStandaloneStoreFailureUsesUnavailableServiceOnLaunchAndRebuild() async {
        let suiteName = "TempMasterTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        defaults.set(DataSource.standalone.rawValue, forKey: "dataSource")

        let launchedEnvironment = AppEnvironment(arguments: [], defaults: defaults, storeFactory: { nil })
        await assertStandaloneUnavailable(launchedEnvironment.service)

        defaults.set(DataSource.remote.rawValue, forKey: "dataSource")
        let rebuiltEnvironment = AppEnvironment(arguments: [], defaults: defaults, storeFactory: { nil })
        rebuiltEnvironment.setDataSource(.standalone)
        await assertStandaloneUnavailable(rebuiltEnvironment.service)
    }

    private func assertStandaloneUnavailable(_ service: any MeterService) async {
        do {
            _ = try await service.fetchMeters()
            XCTFail("Expected the local database error.")
        } catch let error as ServiceError {
            XCTAssertEqual(error.errorDescription, L10n.text("standalone_unavailable"))
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
        do {
            _ = try await service.downloadBackup()
            XCTFail("Expected the local database backup error.")
        } catch let error as BackupError {
            XCTAssertEqual(error.transportError, L10n.text("standalone_unavailable"))
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
}

private final class CountingCredentials: CredentialsProviding, @unchecked Sendable {
    var readCount = 0
    func read(account: String) -> String? {
        readCount += 1
        return nil
    }
    func save(_ value: String, account: String) throws {}
    func delete(account: String) throws {}
}

private final class MemoryCredentials: CredentialsProviding, @unchecked Sendable {
    private let lock = NSLock()
    private var values: [String: String] = [:]

    func read(account: String) -> String? {
        lock.lock()
        defer { lock.unlock() }
        return values[account]
    }

    func save(_ value: String, account: String) throws {
        lock.lock()
        defer { lock.unlock() }
        values[account] = value
    }

    func delete(account: String) throws {
        lock.lock()
        defer { lock.unlock() }
        values.removeValue(forKey: account)
    }
}

private actor HistoryGate {
    private var isOpen = false
    private var started = false
    private var startContinuation: CheckedContinuation<Void, Never>?
    private var continuations: [CheckedContinuation<Void, Never>] = []

    func pause() async {
        started = true
        startContinuation?.resume()
        startContinuation = nil
        guard !isOpen else { return }
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            continuations.append(continuation)
        }
    }

    func waitUntilStarted() async {
        guard !started else { return }
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            startContinuation = continuation
        }
    }

    func open() {
        isOpen = true
        let waiting = continuations
        continuations.removeAll()
        waiting.forEach { $0.resume() }
    }
}

private actor DelayedHistoryService: MeterService {
    private let gate: HistoryGate
    private var devices: [MeterDevice] = []

    init(gate: HistoryGate) {
        self.gate = gate
    }

    func setDevices(_ devices: [MeterDevice]) {
        self.devices = devices
    }

    func healthz() async throws -> HealthResponse { HealthResponse(status: "ok") }
    func fetchMeters() async throws -> MetersResponse { MetersResponse(meters: devices, lastUpdated: nil) }
    func fetchHistory(deviceId: String, timeScale: TimeScale) async throws -> HistoryResponse {
        if timeScale == .day {
            await gate.pause()
            return HistoryResponse(history: [MeterReading(timestamp: Date(timeIntervalSince1970: 1), temperature: 1, humidity: 0, battery: nil)])
        }
        return HistoryResponse(history: [MeterReading(timestamp: Date(timeIntervalSince1970: 2), temperature: 2, humidity: 0, battery: nil)])
    }
    func refresh() async throws -> RefreshResponse {
        RefreshResponse(status: "ok", message: "Data collection triggered", metersCount: devices.count)
    }
    func fetchStatus() async throws -> StatusResponse {
        StatusResponse(configured: true, metersCount: devices.count, isRateLimited: false, backoffRemaining: 0, lastApiCall: nil, collectionInterval: 3600)
    }
    func fetchLatencyLogs(_ q: LatencyLogQuery) async throws -> LatencyLogsResponse { LatencyLogsResponse(logs: [], count: 0) }
    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats { .empty }
    func importData(_ json: Data) async throws -> ImportResult { ImportResult(status: "ok", importedDevices: 0, importedReadings: 0) }
    func downloadBackup() async throws -> BackupFile {
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try Data().write(to: file)
        return BackupFile(fileURL: file, filename: file.lastPathComponent)
    }
}
