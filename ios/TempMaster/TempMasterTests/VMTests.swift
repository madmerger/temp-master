import XCTest
@testable import TempMaster

private final class FailingService: MeterService {
    func fetchMeters() async throws -> MetersResponse {
        throw MeterServiceError.transport("connection refused")
    }
    func fetchHistory(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse {
        throw MeterServiceError.transport("connection refused")
    }
    func refresh() async throws -> RefreshResponse {
        throw MeterServiceError.transport("connection refused")
    }
    func fetchStatus() async throws -> ServiceStatus {
        throw MeterServiceError.transport("connection refused")
    }
    func healthCheck() async throws -> Bool { false }
    func fetchLatencyLogs(_ f: LatencyLogFilter) async throws -> [LatencyLog] { [] }
    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats {
        throw MeterServiceError.transport("connection refused")
    }
    func importData(_ d: ImportData) async throws -> ImportResult {
        throw MeterServiceError.invalidImport("bad")
    }
    func exportBackup() async throws -> URL { throw MeterServiceError.transport("x") }
}

private final class RefreshFailsThenWorks: MeterService {
    private let inner = MockMeterService()
    var refreshShouldFail = true
    func fetchMeters() async throws -> MetersResponse { try await inner.fetchMeters() }
    func fetchHistory(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse {
        try await inner.fetchHistory(deviceID: deviceID, timeScale: timeScale)
    }
    func refresh() async throws -> RefreshResponse {
        if refreshShouldFail { throw MeterServiceError.transport("500 boom") }
        return try await inner.refresh()
    }
    func fetchStatus() async throws -> ServiceStatus { try await inner.fetchStatus() }
    func healthCheck() async throws -> Bool { true }
    func fetchLatencyLogs(_ f: LatencyLogFilter) async throws -> [LatencyLog] { [] }
    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats {
        try await inner.fetchLatencyStats(start: start, end: end)
    }
    func importData(_ d: ImportData) async throws -> ImportResult {
        try await inner.importData(d)
    }
    func exportBackup() async throws -> URL { try await inner.exportBackup() }
}

@MainActor
final class DashboardViewModelTests: XCTestCase {
    func testStatusTextSingularAndPlural() async {
        let svc = MockMeterService()
        let vm = DashboardViewModel(service: svc)
        await vm.load()
        XCTAssertEqual(vm.statusText, "Monitoring 6 meters")
        XCTAssertTrue(vm.isConnected)
        XCTAssertNil(vm.errorMessage)
    }

    func testActiveStalePartition() async {
        let vm = DashboardViewModel(service: MockMeterService())
        await vm.load()
        let (active, stale) = vm.activeStale
        XCTAssertEqual(active.map(\.deviceID), ["SEED-D1", "SEED-D2", "SEED-D3", "SEED-D6"])
        XCTAssertEqual(stale.map(\.deviceID), ["SEED-D4", "SEED-D5"])
    }

    func testErrorSetsDisconnectedAndPrefix() async {
        let vm = DashboardViewModel(service: FailingService())
        await vm.load()
        XCTAssertFalse(vm.isConnected)
        XCTAssertTrue(vm.errorMessage!.hasPrefix("Failed to fetch meters"))
    }

    func testRefreshFailureThenLoadClearsError() async {
        // B-07: refresh error shows message; the follow-up successful load clears it.
        let svc = RefreshFailsThenWorks()
        let vm = DashboardViewModel(service: svc)
        await vm.load()
        await vm.refreshTapped()
        XCTAssertNil(vm.errorMessage)
        XCTAssertTrue(vm.isConnected)
        XCTAssertFalse(vm.isRefreshing)
    }

    func testRateLimitText() async {
        var svc = MockMeterService()
        svc.rateLimited = true
        let vm = DashboardViewModel(service: svc)
        await vm.load()
        XCTAssertTrue(vm.isRateLimited)
        XCTAssertEqual(vm.rateLimitText,
                       "SwitchBot API rate limit reached. Retry in 120 seconds.")
    }

    func testLastRefreshFormat() async {
        let vm = DashboardViewModel(service: MockMeterService())
        vm.now = { Date(timeIntervalSince1970: 1_700_000_000) }
        await vm.load()
        XCTAssertTrue(vm.lastRefreshText.hasPrefix("Last refresh: "))
    }
}

@MainActor
final class ImportViewModelTests: XCTestCase {
    func testPastedJSONSuccess() async {
        let vm = ImportViewModel(service: MockMeterService())
        vm.pastedJSON = """
        {"devices": [{"device_id": "X", "device_name": "n", "device_type": "Meter",
                      "readings": [{"timestamp": "2026-09-30T04:00:00Z",
                                    "temperature": 1, "humidity": 2}]}]}
        """
        await vm.importPasted()
        XCTAssertEqual(vm.resultMessage, "Imported 1 devices, 1 readings")
        XCTAssertNil(vm.errorMessage)
    }

    func testInvalidJSONError() async {
        let vm = ImportViewModel(service: MockMeterService())
        vm.pastedJSON = "{not json"
        await vm.importPasted()
        XCTAssertNotNil(vm.errorMessage)
        XCTAssertNil(vm.resultMessage)
    }
}
