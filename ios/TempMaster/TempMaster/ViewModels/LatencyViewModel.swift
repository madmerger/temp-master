import Foundation

@MainActor
final class LatencyViewModel: ObservableObject {
    @Published var endpoint = ""
    @Published var deviceID = ""
    @Published var limit = 100
    @Published var useStart = false
    @Published var start = Date().addingTimeInterval(-3600)
    @Published var useEnd = false
    @Published var end = Date()
    @Published private(set) var stats: LatencyStats?
    @Published private(set) var logs: [LatencyLog] = []
    @Published private(set) var errorMessage: String?

    var service: any MeterService
    init(service: any MeterService) { self.service = service }

    func load() async {
        let filter = LatencyLogFilter(
            start: useStart ? start : nil,
            end: useEnd ? end : nil,
            endpoint: endpoint.isEmpty ? nil : endpoint,
            deviceID: deviceID.isEmpty ? nil : deviceID,
            limit: limit)
        do {
            async let s = service.fetchLatencyStats(
                start: filter.start, end: filter.end)
            async let l = service.fetchLatencyLogs(filter)
            stats = try await s
            logs = try await l
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
