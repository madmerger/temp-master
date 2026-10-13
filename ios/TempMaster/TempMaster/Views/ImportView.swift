import SwiftUI
import UniformTypeIdentifiers

struct ImportView: View {
    @ObservedObject var viewModel: ImportViewModel
    @State private var choosingFile = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Button(L10n.text("choose_json")) { choosingFile = true }
                    .buttonStyle(.borderedProminent)
                    .accessibilityIdentifier("importChooseButton")
                TextEditor(text: $viewModel.pastedJSON)
                    .frame(minHeight: 220)
                    .padding(5)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.35)))
                    .accessibilityIdentifier("importJSONEditor")
                Button(L10n.text("import_pasted")) { Task { await viewModel.importPasted() } }
                    .buttonStyle(.bordered)
                    .accessibilityIdentifier("importPasteButton")
                if let result = viewModel.result {
                    Text(verbatim: L10n.format("imported_result", result.importedDevices, result.importedReadings))
                        .accessibilityIdentifier("importResult")
                }
                if let error = viewModel.errorMessage {
                    Text(verbatim: error)
                        .foregroundStyle(.red)
                        .accessibilityIdentifier("importError")
                }
            }
            .padding()
        }
        .navigationTitle(L10n.text("tab_import"))
        .fileImporter(isPresented: $choosingFile, allowedContentTypes: [.json], allowsMultipleSelection: false) { result in
            guard case let .success(urls) = result, let url = urls.first else { return }
            let hasAccess = url.startAccessingSecurityScopedResource()
            defer { if hasAccess { url.stopAccessingSecurityScopedResource() } }
            do {
                let data = try Data(contentsOf: url)
                Task { await viewModel.importData(data) }
            } catch {
                Task { @MainActor in
                    viewModel.setError(error.localizedDescription)
                }
            }
        }
    }
}
