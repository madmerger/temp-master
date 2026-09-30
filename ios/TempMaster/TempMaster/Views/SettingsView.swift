import SwiftUI

/// L-13: data source, backend URL, credentials (Keychain), connection test,
/// status snapshot. V-03: SecureField only; values never shown after save.
struct SettingsView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @StateObject private var vm: SettingsViewModel

    init() {
        _vm = StateObject(wrappedValue: SettingsViewModel())
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("settings.data_source".localized) {
                    Picker("settings.data_source".localized,
                           selection: $vm.mode) {
                        ForEach(DataSourceMode.allCases) { mode in
                            Text(mode.labelKey.localized).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                    .accessibilityIdentifier("settings-data-source")
                }

                if vm.mode == .remote {
                    Section("settings.backend_url".localized) {
                        TextField("settings.backend_url".localized,
                                  text: $vm.backendURLText)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.URL)
                            .accessibilityIdentifier("settings-backend-url")
                        if !vm.isBackendURLValid {
                            Text("settings.invalid_url".localized)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                    }
                }

                if vm.mode == .standalone {
                    Section("settings.credentials".localized) {
                        SecureField("settings.token".localized, text: $vm.token)
                            .textInputAutocapitalization(.never)
                            .accessibilityIdentifier("settings-token")
                        SecureField("settings.secret".localized, text: $vm.secret)
                            .textInputAutocapitalization(.never)
                            .accessibilityIdentifier("settings-secret")
                        HStack {
                            Button("settings.save".localized) {
                                vm.saveCredentials()
                            }
                            .disabled(vm.token.isEmpty || vm.secret.isEmpty)
                            .accessibilityIdentifier("settings-save-credentials")
                            if vm.hasCredentials {
                                Button("settings.clear".localized) {
                                    vm.clearCredentials()
                                }
                                .foregroundStyle(.red)
                                .accessibilityIdentifier("settings-clear-credentials")
                            }
                        }
                        if vm.hasCredentials {
                            Text("settings.credentials_saved".localized)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        if let saveError = vm.saveError {
                            Text(verbatim: saveError)
                                .font(.caption)
                                .foregroundStyle(.red)
                                .accessibilityIdentifier("settings-save-error")
                        }
                    }
                }

                Section {
                    Button("settings.apply".localized) {
                        vm.applySettings()
                    }
                    .disabled(vm.mode == .remote && !vm.isBackendURLValid)
                    .accessibilityIdentifier("settings-apply")
                    Button("settings.test_connection".localized) {
                        Task { await vm.testConnection() }
                    }
                    .disabled(vm.testInFlight)
                    .accessibilityIdentifier("settings-test-connection")
                    if let result = vm.testResult {
                        Text(verbatim: result)
                            .foregroundStyle(result == "OK" ? .green : .red)
                            .accessibilityIdentifier("settings-test-result")
                    }
                }

                Section("settings.status".localized) {
                    if let status = vm.status {
                        statusRow("settings.configured".localizedString,
                                  status.configured
                                      ? "settings.yes".localizedString
                                      : "settings.no".localizedString)
                        statusRow("settings.meters_count".localizedString,
                                  "\(status.metersCount)")
                        statusRow("settings.rate_limited".localizedString,
                                  status.isRateLimited
                                      ? "settings.yes".localizedString
                                      : "settings.no".localizedString)
                        statusRow("settings.backoff_remaining".localizedString,
                                  "\(status.backoffRemaining)")
                        statusRow("settings.last_api_call".localizedString,
                                  status.lastApiCall > 0
                                      ? Date(timeIntervalSince1970: status.lastApiCall)
                                          .formatted(date: .abbreviated, time: .standard)
                                      : "-")
                        statusRow("settings.collection_interval".localizedString,
                                  "\(status.collectionInterval)")
                    } else {
                        Text("settings.no_status".localized)
                            .foregroundStyle(.secondary)
                    }
                }

                Section {
                    HStack {
                        Text("settings.version".localized)
                        Spacer()
                        Text(verbatim: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "")
                            .foregroundStyle(.secondary)
                    }
                    .accessibilityIdentifier("settings-version")
                }
            }
            .navigationTitle("settings.title".localized)
            .task(id: environment.serviceVersion) {
                vm.environment = environment
                vm.reloadFromEnvironment()
                await vm.loadStatus()
            }
        }
    }

    private func statusRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(verbatim: label)
            Spacer()
            Text(verbatim: value)
                .foregroundStyle(.secondary)
        }
    }
}
