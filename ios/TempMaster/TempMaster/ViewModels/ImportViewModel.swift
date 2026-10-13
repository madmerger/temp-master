import Foundation

@MainActor
final class ImportViewModel: ObservableObject {
    @Published var pastedJSON = ""
    @Published private(set) var resultMessage: String?
    @Published private(set) var errorMessage: String?
    @Published private(set) var isImporting = false

    var service: any MeterService
    init(service: any MeterService) { self.service = service }

    func importFile(url: URL) async {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        do {
            let data = try Data(contentsOf: url)
            await importData(data)
        } catch {
            errorMessage = error.localizedDescription
            resultMessage = nil
        }
    }

    func importPasted() async {
        await importData(Data(pastedJSON.utf8))
    }

    private func importData(_ data: Data) async {
        isImporting = true
        defer { isImporting = false }
        do {
            let importData = try JSONCoding.decoder().decode(ImportData.self, from: data)
            let result = try await service.importData(importData)
            resultMessage = String(
                format: "import.result_fmt".localizedString,
                result.importedDevices, result.importedReadings)
            errorMessage = nil
        } catch let error as MeterServiceError {
            errorMessage = error.localizedDescription
            resultMessage = nil
        } catch {
            errorMessage = "import.invalid".localizedString + ": \(error.localizedDescription)"
            resultMessage = nil
        }
    }
}
