import Foundation
import Combine

@MainActor
final class ImportViewModel: ObservableObject {
    @Published var pastedJSON = ""
    @Published private(set) var result: ImportResult?
    @Published private(set) var errorMessage: String?
    private var service: any MeterService

    init(service: any MeterService) { self.service = service }
    func setService(_ service: any MeterService) { self.service = service }
    func setError(_ message: String) { errorMessage = message }

    func importData(_ data: Data) async {
        do {
            result = try await service.importData(data)
            errorMessage = nil
            NotificationCenter.default.post(name: AppEnvironment.dashboardReloadNotification, object: nil)
        } catch {
            result = nil
            errorMessage = error.localizedDescription
        }
    }

    func importPasted() async {
        await importData(Data(pastedJSON.utf8))
    }
}
