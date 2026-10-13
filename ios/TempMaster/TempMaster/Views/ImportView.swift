import SwiftUI

/// L-12: import JSON (file picker or pasted text) -> result counts.
struct ImportView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @StateObject private var vm: ImportViewModel
    @State private var showImporter = false

    init() {
        _vm = StateObject(wrappedValue: ImportViewModel(service: MockMeterService()))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("import.file_section".localized) {
                    Button("import.choose_file".localized) {
                        showImporter = true
                    }
                    .accessibilityIdentifier("import-choose-file")
                }
                Section("import.paste_section".localized) {
                    TextEditor(text: $vm.pastedJSON)
                        .font(.system(.caption, design: .monospaced))
                        .frame(minHeight: 160)
                        .accessibilityIdentifier("import-pasted-json")
                    Button("import.button".localized) {
                        Task { await vm.importPasted() }
                    }
                    .disabled(vm.pastedJSON.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                              || vm.isImporting)
                    .accessibilityIdentifier("import-button")
                }
                if let result = vm.resultMessage {
                    Section {
                        Text(verbatim: result)
                            .foregroundStyle(.green)
                            .accessibilityIdentifier("import-result")
                    }
                }
                if let error = vm.errorMessage {
                    Section {
                        Text(verbatim: error)
                            .foregroundStyle(.red)
                            .accessibilityIdentifier("import-error")
                    }
                }
            }
            .navigationTitle("import.title".localized)
            .fileImporter(isPresented: $showImporter,
                          allowedContentTypes: [.json]) { result in
                if case .success(let url) = result {
                    Task { await vm.importFile(url: url) }
                }
            }
            .task(id: environment.serviceVersion) {
                vm.service = environment.service
            }
        }
    }
}
