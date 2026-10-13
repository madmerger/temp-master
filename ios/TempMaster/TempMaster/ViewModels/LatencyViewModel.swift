import Foundation
import Combine

@MainActor
final class LatencyViewModel: ObservableObject {
    @Published private(set) var stats: LatencyStats = .empty
    @Published private(set) var logs: [LatencyLog] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published var endpoint = ""
    @Published var deviceId = ""
    @Published var limit = "100"
    @Published var startEnabled = false
    @Published var endEnabled = false
    @Published var startDate = Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
    @Published var endDate = Date()
    private var service: any MeterService

    init(service: any MeterService) { self.service = service }
    func setService(_ service: any MeterService) { self.service = service; Task { await apply() } }
    func apply() async {
        isLoading = true
        defer { isLoading = false }
        let start = startEnabled ? startDate : nil
        let end = endEnabled ? endDate : nil
        do {
            async let newStats = service.fetchLatencyStats(start: start, end: end)
            async let response = service.fetchLatencyLogs(LatencyLogQuery(start: start, end: end, endpoint: endpoint, deviceId: deviceId, limit: Int(limit) ?? 100))
            stats = try await newStats
            let values = try await response
            logs = values.logs
            errorMessage = nil
        } catch { errorMessage = error.localizedDescription }
    }
}
