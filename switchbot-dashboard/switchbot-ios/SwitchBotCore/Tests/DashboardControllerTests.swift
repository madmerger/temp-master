import XCTest
@testable import SwitchBotCore

final class DashboardControllerTests: XCTestCase {
    func testMockScenarioHasFourActiveTwoStaleAndTwelvePointsPerRange() async throws {
        let now = try XCTUnwrap(date("2026-11-02T09:00:00Z"))
        let controller = DashboardController(api: MockDashboardAPI(now: now), now: { now })

        let dayState = await controller.load(timeScale: .day)
        XCTAssertEqual(dayState.activeMeters.map(\.deviceID).sorted(), MockDashboardAPI.activeDeviceIDs.sorted())
        XCTAssertEqual(dayState.staleMeters.map(\.deviceID).sorted(), MockDashboardAPI.staleDeviceIDs.sorted())
        XCTAssertEqual(dayState.histories.count, 4)
        XCTAssertTrue(dayState.histories.values.allSatisfy { $0.count == 12 })
        XCTAssertEqual(dayState.statusText, "Monitoring 6 meter(s)")
        XCTAssertEqual(dayState.connection, .connected)

        let dayFirstPoint = try XCTUnwrap(dayState.histories["C76B0046301A"]?.first)
        let weekState = await controller.changeTimeScale(.week)
        let weekFirstPoint = try XCTUnwrap(weekState.histories["C76B0046301A"]?.first)
        XCTAssertNotEqual(dayFirstPoint.temperature, weekFirstPoint.temperature)
    }

    func testHistoryFailureKeepsConnectionAndSuccessfulMeterHistory() async throws {
        let now = try XCTUnwrap(date("2026-11-02T09:00:00Z"))
        let api = FakeDashboardAPI(meters: meters(["active-a", "active-b"]), historyFailures: ["active-b"])
        let controller = DashboardController(api: api, now: { now })

        let state = await controller.load(timeScale: .day)

        XCTAssertEqual(state.connection, .connected)
        XCTAssertEqual(state.errorMessage, "Failed to fetch history: history unavailable")
        XCTAssertEqual(state.histories["active-a"]?.count, 1)
        XCTAssertNil(state.histories["active-b"])
    }

    func testRefreshErrorSurvivesSuccessfulTimeScaleChange() async throws {
        let now = try XCTUnwrap(date("2026-11-02T09:00:00Z"))
        let api = FakeDashboardAPI(meters: meters(["active-a"]), refreshError: "refresh unavailable")
        let controller = DashboardController(api: api, now: { now })

        let state = await controller.refresh(timeScale: .day)
        XCTAssertEqual(state.connection, .connected)
        XCTAssertEqual(state.errorMessage, "Failed to refresh: refresh unavailable")

        let changedState = await controller.changeTimeScale(.week)
        XCTAssertEqual(changedState.connection, .connected)
        XCTAssertEqual(changedState.errorMessage, "Failed to refresh: refresh unavailable")
    }

    func testSuccessfulTimeScaleChangeClearsPriorHistoryError() async throws {
        let now = try XCTUnwrap(date("2026-11-02T09:00:00Z"))
        let api = FakeDashboardAPI(meters: meters(["active-a"]), historyFailures: ["active-a"])
        let controller = DashboardController(api: api, now: { now })

        let failedState = await controller.load(timeScale: .day)
        XCTAssertEqual(failedState.errorMessage, "Failed to fetch history: history unavailable")

        await api.setHistoryFailures([])
        let recoveredState = await controller.changeTimeScale(.week)
        XCTAssertNil(recoveredState.errorMessage)
        XCTAssertEqual(recoveredState.connection, .connected)
    }

    func testSupersededHistoryResponseIsDiscarded() async throws {
        let now = try XCTUnwrap(date("2026-11-02T09:00:00Z"))
        let api = GatedDashboardAPI(meters: meters(["active-a"]), now: now)
        let controller = DashboardController(api: api, now: { now })

        let dayLoad = Task {
            await controller.load(timeScale: .day)
        }
        await api.waitForDayHistory()
        let weekState = await controller.changeTimeScale(.week)
        XCTAssertEqual(weekState.histories["active-a"]?.first?.temperature, 22)

        await api.releaseDayHistory()
        _ = await dayLoad.value
        XCTAssertEqual(controller.state.histories["active-a"]?.first?.temperature, 22)
    }

    func testMetersFailureDisconnectsAndRateLimitIsFormatted() async throws {
        let now = try XCTUnwrap(date("2026-11-02T09:00:00Z"))
        let failingAPI = FakeDashboardAPI(meters: [], metersError: "meters unavailable")
        let failedState = await DashboardController(api: failingAPI, now: { now }).load()
        XCTAssertEqual(failedState.connection, .disconnected)
        XCTAssertEqual(failedState.errorMessage, "Failed to fetch meters: meters unavailable")

        let rateLimitedAPI = FakeDashboardAPI(
            meters: meters(["active-a"]),
            isRateLimited: true,
            backoffRemaining: 42
        )
        let connectedState = await DashboardController(api: rateLimitedAPI, now: { now }).load()
        XCTAssertEqual(
            connectedState.rateLimitMessage,
            "SwitchBot API rate limit reached. Retry in 42 seconds."
        )
    }

    private func meters(_ ids: [String]) -> [Meter] {
        let now = Date(timeIntervalSince1970: 1_800_000_000)
        return ids.map {
            Meter(
                deviceID: $0,
                deviceName: $0,
                deviceType: "Meter",
                currentTemperature: 20,
                currentHumidity: 60,
                battery: 80,
                lastUpdated: now.addingTimeInterval(-60)
            )
        }
    }

    private func date(_ value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: value)
    }
}

private enum TestAPIError: Error, LocalizedError, Sendable {
    case message(String)

    var errorDescription: String? {
        switch self {
        case let .message(value): value
        }
    }
}

private actor FakeDashboardAPI: DashboardAPI {
    private let response: MetersResponse
    private let metersError: String?
    private let statusError: String?
    private let refreshError: String?
    private var historyFailures: Set<String>
    private let isRateLimited: Bool
    private let backoffRemaining: Int

    init(
        meters: [Meter],
        metersError: String? = nil,
        statusError: String? = nil,
        refreshError: String? = nil,
        historyFailures: Set<String> = [],
        isRateLimited: Bool = false,
        backoffRemaining: Int = 0
    ) {
        response = MetersResponse(meters: meters)
        self.metersError = metersError
        self.statusError = statusError
        self.refreshError = refreshError
        self.historyFailures = historyFailures
        self.isRateLimited = isRateLimited
        self.backoffRemaining = backoffRemaining
    }

    func meters() async throws -> MetersResponse {
        if let metersError {
            throw TestAPIError.message(metersError)
        }
        return response
    }

    func status() async throws -> StatusResponse {
        if let statusError {
            throw TestAPIError.message(statusError)
        }
        return StatusResponse(
            configured: true,
            metersCount: response.meters.count,
            isRateLimited: isRateLimited,
            backoffRemaining: backoffRemaining,
            lastAPICall: 0,
            collectionInterval: 120
        )
    }

    func history(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse {
        if historyFailures.contains(deviceID) {
            throw TestAPIError.message("history unavailable")
        }
        let meter = response.meters.first { $0.deviceID == deviceID }
        let reading = MeterReading(
            timestamp: Date(timeIntervalSince1970: 0),
            temperature: 21,
            humidity: 60,
            battery: 80
        )
        return HistoryResponse(deviceID: deviceID, timeScale: timeScale.rawValue, history: [reading], device: meter)
    }

    func refresh() async throws -> RefreshResponse {
        if let refreshError {
            throw TestAPIError.message(refreshError)
        }
        return RefreshResponse(status: "success", metersCount: response.meters.count)
    }

    func setHistoryFailures(_ ids: Set<String>) {
        historyFailures = ids
    }
}

private actor GatedDashboardAPI: DashboardAPI {
    private let response: MetersResponse
    private let now: Date
    private var dayStarted = false
    private var dayStartedWaiter: CheckedContinuation<Void, Never>?
    private var dayRelease: CheckedContinuation<Void, Never>?

    init(meters: [Meter], now: Date) {
        response = MetersResponse(meters: meters)
        self.now = now
    }

    func meters() async throws -> MetersResponse { response }

    func status() async throws -> StatusResponse {
        StatusResponse(
            configured: true,
            metersCount: response.meters.count,
            isRateLimited: false,
            backoffRemaining: 0,
            lastAPICall: 0,
            collectionInterval: 120
        )
    }

    func history(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse {
        if timeScale == .day {
            dayStarted = true
            dayStartedWaiter?.resume()
            dayStartedWaiter = nil
            await withCheckedContinuation { continuation in
                dayRelease = continuation
            }
        }
        let reading = MeterReading(
            timestamp: now,
            temperature: timeScale == .week ? 22 : 11,
            humidity: 60,
            battery: 80
        )
        return HistoryResponse(deviceID: deviceID, timeScale: timeScale.rawValue, history: [reading])
    }

    func refresh() async throws -> RefreshResponse {
        RefreshResponse(status: "success", metersCount: response.meters.count)
    }

    func waitForDayHistory() async {
        if dayStarted {
            return
        }
        await withCheckedContinuation { continuation in
            dayStartedWaiter = continuation
        }
    }

    func releaseDayHistory() {
        dayRelease?.resume()
        dayRelease = nil
    }
}
