import Foundation
import Combine

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published private(set) var meters: [MeterDevice] = []
    @Published private(set) var histories: [String: [MeterReading]] = [:]
    @Published private(set) var status: StatusResponse?
    @Published private(set) var lastRefresh: Date?
    @Published private(set) var isLoading = true
    @Published private(set) var isRefreshing = false
    @Published private(set) var isDownloading = false
    @Published private(set) var isConnected = true
    @Published private(set) var errorMessage: String?
    @Published var backupFile: BackupFile?
    @Published var timeScale: TimeScale = .day

    private var service: any MeterService
    private let now: () -> Date
    private let autoRefreshInterval: TimeInterval

    init(service: any MeterService, now: @escaping () -> Date = Date.init, autoRefreshInterval: TimeInterval = 30) {
        self.service = service
        self.now = now
        self.autoRefreshInterval = autoRefreshInterval
    }

    func setService(_ service: any MeterService) {
        self.service = service
        Task { await fetchData() }
    }

    func fetchData() async {
        do {
            let metersResponse = try await service.fetchMeters()
            let fetchedStatus: StatusResponse
            do {
                fetchedStatus = try await service.fetchStatus()
            } catch {
                showError(L10n.format("dashboard.fetch_status_error_prefix", error.localizedDescription))
                return
            }
            meters = metersResponse.meters
            status = fetchedStatus
            lastRefresh = now()
            isLoading = false
            errorMessage = nil
            isConnected = true
            await fetchHistories()
        } catch {
            showError(L10n.format("dashboard.fetch_meters_error_prefix", error.localizedDescription))
        }
    }

    func refresh() async {
        guard !isRefreshing else { return }
        isRefreshing = true
        do {
            _ = try await service.refresh()
        } catch {
            showError(L10n.format("dashboard.refresh_error_prefix", error.localizedDescription))
        }
        await fetchData()
        isRefreshing = false
    }

    func downloadBackup() async {
        guard !isDownloading else { return }
        isDownloading = true
        do {
            backupFile = try await service.downloadBackup()
        } catch let error as BackupError {
            showError(error.userMessage)
        } catch {
            showError(error.localizedDescription)
        }
        isDownloading = false
    }

    func finishSharingBackup() {
        guard let file = backupFile else { return }
        self.backupFile = nil
        try? FileManager.default.removeItem(at: file.fileURL.deletingLastPathComponent())
    }

    func setTimeScale(_ scale: TimeScale) async {
        guard timeScale != scale else { return }
        timeScale = scale
        histories.removeAll()
        await fetchHistories()
    }

    func reloadAfterImport() async {
        await fetchData()
    }

    var activeMeters: [MeterDevice] { meters.filter { !MeterRules.isStale($0, now: now()) } }
    var staleMeters: [MeterDevice] { meters.filter { MeterRules.isStale($0, now: now()) } }

    var statusCountText: String? {
        guard let status else { return nil }
        return status.metersCount == 1 ? L10n.text("monitoring_singular") : L10n.format("monitoring_plural", status.metersCount)
    }

    var lastRefreshText: String? {
        guard let lastRefresh else { return nil }
        let formatter = DateFormatter()
        formatter.locale = Locale.current
        formatter.timeZone = .current
        formatter.dateFormat = "HH:mm:ss"
        return L10n.format("last_refresh", formatter.string(from: lastRefresh))
    }

    private func fetchHistories() async {
        let service = self.service
        let scale = timeScale
        let active = activeMeters
        removeInactiveHistories(keeping: Set(active.map(\.deviceId)))
        await withTaskGroup(of: (String, [MeterReading]?).self) { group in
            for meter in active {
                group.addTask {
                    do {
                        return (meter.deviceId, try await service.fetchHistory(deviceId: meter.deviceId, timeScale: scale).history)
                    } catch {
                        return (meter.deviceId, nil)
                    }
                }
            }
            for await (deviceId, history) in group {
                let currentActiveIDs = Set(activeMeters.map(\.deviceId))
                removeInactiveHistories(keeping: currentActiveIDs)
                if let history, scale == self.timeScale, currentActiveIDs.contains(deviceId) {
                    histories[deviceId] = history
                }
            }
        }
    }

    private func removeInactiveHistories(keeping activeDeviceIDs: Set<String>) {
        for deviceId in Array(histories.keys) where !activeDeviceIDs.contains(deviceId) {
            histories.removeValue(forKey: deviceId)
        }
    }

    private func showError(_ message: String) {
        isLoading = false
        errorMessage = message
        isConnected = false
    }

    var refreshInterval: TimeInterval { autoRefreshInterval }
}
