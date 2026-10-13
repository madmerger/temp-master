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

    func testRefreshFailureIsClearedBySuccessfulFetchAndRangeChangeRefetches() async {
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
}

@MainActor
final class SettingsValidationTests: XCTestCase {
    func testCustomBackendURLPolicy() {
        XCTAssertTrue(SettingsViewModel.isAllowedBackendURL("https://example.com"))
        XCTAssertTrue(SettingsViewModel.isAllowedBackendURL("https://localhost:8443"))
        XCTAssertTrue(SettingsViewModel.isAllowedBackendURL("http://localhost:8080"))
        XCTAssertTrue(SettingsViewModel.isAllowedBackendURL("http://127.0.0.1:8000"))
        XCTAssertFalse(SettingsViewModel.isAllowedBackendURL("http://example.com"))
        XCTAssertFalse(SettingsViewModel.isAllowedBackendURL("http://[::1]"))
        XCTAssertFalse(SettingsViewModel.isAllowedBackendURL("file:///tmp/data"))
    }

    func testMockSettingsDoNotTouchKeychain() {
        let credentials = CountingCredentials()
        let environment = AppEnvironment(arguments: ["-UITestMockData"], keychain: credentials)
        _ = SettingsViewModel(environment: environment)
        XCTAssertEqual(credentials.readCount, 0)
        XCTAssertTrue(environment.isMockMode)
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
