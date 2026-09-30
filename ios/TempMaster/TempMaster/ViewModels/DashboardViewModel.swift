import Combine
import Foundation

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published private(set) var meters: [MeterDevice] = []
    @Published private(set) var status: ServiceStatus?
    @Published var timeScale: TimeScale = .day
    @Published private(set) var histories: [String: [MeterReading]] = [:]
    @Published private(set) var isLoading = true
    @Published private(set) var errorMessage: String?
    @Published private(set) var isConnected = false
    @Published private(set) var lastRefresh: Date?
    @Published private(set) var isRefreshing = false
    @Published var backupURL: URL?

    var service: any MeterService
    var now: () -> Date = { Date() }

    init(service: any MeterService) {
        self.service = service
    }

    /// B-06: fetchMeters then fetchStatus; success clears error -> Connected.
    func load() async {
        do {
            let metersResp = try await service.fetchMeters()
            do {
                let status = try await service.fetchStatus()
                meters = metersResp.meters
                self.status = status
                errorMessage = nil
                isConnected = true
                lastRefresh = now()
                isLoading = false
                await fetchHistories()
            } catch {
                showError("error.fetch_status".localizedString, error)
            }
        } catch {
            showError("error.fetch_meters".localizedString, error)
        }
    }

    /// B-07: refresh; on error show "Failed to refresh: ..." + Disconnected,
    /// then reload anyway (a successful reload clears the error).
    func refreshTapped() async {
        isRefreshing = true
        do {
            _ = try await service.refresh()
        } catch {
            showError("error.refresh".localizedString, error)
        }
        await load()
        isRefreshing = false
    }

    func setTimeScale(_ scale: TimeScale) async {
        timeScale = scale
        await fetchHistories()
    }

    private func fetchHistories() async {
        let (active, _) = activeStale
        let scale = timeScale
        await withTaskGroup(of: (String, [MeterReading]).self) { group in
            for meter in active {
                group.addTask { [service] in
                    let resp = try? await service.fetchHistory(
                        deviceID: meter.deviceID, timeScale: scale)
                    return (meter.deviceID, resp?.history ?? [])
                }
            }
            for await (id, history) in group {
                histories[id] = history
            }
        }
    }

    func backupTapped() async {
        backupURL = try? await service.exportBackup()
    }

    // MARK: - computed

    var activeStale: (active: [MeterDevice], stale: [MeterDevice]) {
        StaleMeterPolicy.partition(meters, now: now())
    }

    var statusText: String {
        let count = status?.metersCount ?? 0
        return String(format: "dashboard.monitoring_meters".localizedString, count)
    }

    var lastRefreshText: String {
        guard let lastRefresh else { return "" }
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss"
        return String(format: "dashboard.last_refresh_fmt".localizedString,
                      f.string(from: lastRefresh))
    }

    var isRateLimited: Bool { status?.isRateLimited ?? false }

    var rateLimitText: String {
        String(format: "ratelimit.message".localizedString,
               status?.backoffRemaining ?? 0)
    }

    private func showError(_ prefixKey: String, _ error: Error) {
        errorMessage = "\(prefixKey): \(error.localizedDescription)"
        isConnected = false
        isLoading = false
    }
}
