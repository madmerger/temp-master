import Foundation

public enum ConnectionState: String, Equatable, Sendable {
    case connecting
    case connected
    case disconnected
}

public struct DashboardState: Equatable, Sendable {
    public var activeMeters: [Meter]
    public var staleMeters: [Meter]
    public var histories: [String: [MeterReading]]
    public var connection: ConnectionState
    public var errorMessage: String?
    public var rateLimitMessage: String?
    public var statusText: String
    public var lastRefresh: Date?

    public init(
        activeMeters: [Meter] = [],
        staleMeters: [Meter] = [],
        histories: [String: [MeterReading]] = [:],
        connection: ConnectionState = .connecting,
        errorMessage: String? = nil,
        rateLimitMessage: String? = nil,
        statusText: String = "Monitoring 0 meters",
        lastRefresh: Date? = nil
    ) {
        self.activeMeters = activeMeters
        self.staleMeters = staleMeters
        self.histories = histories
        self.connection = connection
        self.errorMessage = errorMessage
        self.rateLimitMessage = rateLimitMessage
        self.statusText = statusText
        self.lastRefresh = lastRefresh
    }
}

public final class DashboardController {
    private static let historyErrorPrefix = "Failed to fetch history:"
    private let api: any DashboardAPI
    private let now: () -> Date
    private var selectedTimeScale: TimeScale = .day
    private var loadGeneration = 0
    private var historyGeneration = 0

    public private(set) var state = DashboardState()

    public init(api: any DashboardAPI, now: @escaping () -> Date = Date.init) {
        self.api = api
        self.now = now
    }

    @discardableResult
    public func load(timeScale: TimeScale = .day) async -> DashboardState {
        selectedTimeScale = timeScale
        loadGeneration += 1
        let currentLoad = loadGeneration
        historyGeneration += 1
        state.connection = .connecting

        async let metersResult = capture { try await api.meters() }
        async let statusResult = capture { try await api.status() }
        let (meterResult, statusResultValue) = await (metersResult, statusResult)
        guard currentLoad == loadGeneration else {
            return state
        }

        guard case let .success(metersResponse) = meterResult else {
            state.connection = .disconnected
            state.errorMessage = Self.errorMessage(from: meterResult, prefix: "Failed to fetch meters")
            return state
        }

        let currentDate = now()
        state.activeMeters = metersResponse.meters.filter {
            !StaleMeterPolicy.isStale(lastUpdated: $0.lastUpdated, now: currentDate)
        }
        state.staleMeters = metersResponse.meters.filter {
            StaleMeterPolicy.isStale(lastUpdated: $0.lastUpdated, now: currentDate)
        }

        guard case let .success(statusResponse) = statusResultValue else {
            state.connection = .disconnected
            state.errorMessage = Self.errorMessage(from: statusResultValue, prefix: "Failed to fetch status")
            return state
        }

        state.connection = .connected
        state.errorMessage = nil
        state.statusText = "Monitoring \(metersResponse.meters.count) meter(s)"
        state.lastRefresh = currentDate
        state.rateLimitMessage = statusResponse.isRateLimited
            ? "SwitchBot API rate limit reached. Retry in \(statusResponse.backoffRemaining) seconds."
            : nil

        let scale = selectedTimeScale
        let generation = historyGeneration
        await loadHistories(for: state.activeMeters, timeScale: scale, generation: generation)
        return state
    }

    @discardableResult
    public func refresh(timeScale: TimeScale? = nil) async -> DashboardState {
        let scale = timeScale ?? selectedTimeScale
        var refreshError: String?
        do {
            _ = try await api.refresh()
        } catch {
            refreshError = "Failed to refresh: \(error.localizedDescription)"
        }

        _ = await load(timeScale: scale)
        if let refreshError {
            state.errorMessage = refreshError
        }
        return state
    }

    @discardableResult
    public func changeTimeScale(_ timeScale: TimeScale) async -> DashboardState {
        selectedTimeScale = timeScale
        historyGeneration += 1
        let generation = historyGeneration
        await loadHistories(for: state.activeMeters, timeScale: timeScale, generation: generation)
        return state
    }

    private func loadHistories(for meters: [Meter], timeScale: TimeScale, generation: Int) async {
        let results = await withTaskGroup(of: HistoryFetchResult.self, returning: [HistoryFetchResult].self) { group in
            for meter in meters {
                group.addTask {
                    do {
                        let response = try await self.api.history(deviceID: meter.deviceID, timeScale: timeScale)
                        return HistoryFetchResult(deviceID: meter.deviceID, history: response.history, error: nil)
                    } catch {
                        return HistoryFetchResult(
                            deviceID: meter.deviceID,
                            history: nil,
                            error: error.localizedDescription
                        )
                    }
                }
            }

            var results: [HistoryFetchResult] = []
            for await result in group {
                results.append(result)
            }
            return results
        }

        guard generation == historyGeneration else {
            return
        }

        var errors: [String] = []
        for result in results {
            if let history = result.history {
                state.histories[result.deviceID] = history
            } else if let error = result.error {
                errors.append(error)
            }
        }

        if let error = errors.first {
            state.errorMessage = "\(Self.historyErrorPrefix) \(error)"
        } else if state.errorMessage?.hasPrefix(Self.historyErrorPrefix) == true {
            state.errorMessage = nil
        }
    }

    private func capture<T>(_ operation: () async throws -> T) async -> Result<T, Error> {
        do {
            return .success(try await operation())
        } catch {
            return .failure(error)
        }
    }

    private static func errorMessage<T>(from result: Result<T, Error>, prefix: String) -> String {
        guard case let .failure(error) = result else {
            return prefix
        }
        return "\(prefix): \(error.localizedDescription)"
    }

    private struct HistoryFetchResult: Sendable {
        let deviceID: String
        let history: [MeterReading]?
        let error: String?
    }
}
