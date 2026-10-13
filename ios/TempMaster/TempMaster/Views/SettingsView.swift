import SwiftUI

struct SettingsView: View {
    @ObservedObject var viewModel: SettingsViewModel
    @EnvironmentObject private var environment: AppEnvironment

    var body: some View {
        Form {
            Section(L10n.text("data_source")) {
                if environment.isMockMode {
                    LabeledContent(L10n.text("data_source"), value: L10n.text("mock_mode"))
                } else {
                    Picker(L10n.text("data_source"), selection: Binding(
                        get: { environment.dataSource },
                        set: { viewModel.selectDataSource($0) }
                    )) {
                        Text(verbatim: L10n.text("remote")).tag(DataSource.remote)
                        Text(verbatim: L10n.text("standalone")).tag(DataSource.standalone)
                    }
                    .accessibilityIdentifier("dataSourcePicker")
                }
            }
            if !environment.isMockMode && environment.dataSource == .remote {
                Section(L10n.text("backend")) {
                    Picker(L10n.text("backend"), selection: Binding(
                        get: { viewModel.backendChoice },
                        set: { viewModel.selectBackend($0) }
                    )) {
                        Text(verbatim: L10n.text("production")).tag(BackendChoice.production)
                        Text(verbatim: L10n.text("custom_url")).tag(BackendChoice.custom)
                    }
                    .accessibilityIdentifier("backendPicker")
                    if viewModel.backendChoice == .custom {
                        TextField(L10n.text("custom_url_placeholder"), text: $viewModel.customURL)
                            .keyboardType(.URL)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .onSubmit { viewModel.applyCustomURL() }
                            .accessibilityIdentifier("customURLField")
                        if let message = viewModel.customURLError {
                            Text(verbatim: message).foregroundStyle(.red).accessibilityIdentifier("customURLError")
                        }
                    }
                    Button(L10n.text("test_connection")) { Task { await viewModel.testConnection() } }
                        .accessibilityIdentifier("testConnectionButton")
                    if let result = viewModel.connectionTestResult {
                        Text(verbatim: result).accessibilityIdentifier("connectionTestResult")
                    }
                }
            }
            Section(L10n.text("status_section")) {
                statusLine("configured", value: viewModel.status.map { $0.configured ? L10n.text("credentials_saved") : L10n.text("credentials_not_set") })
                    .accessibilityIdentifier("settingsStatus_configured")
                statusLine("meters_count", value: viewModel.status.map { String($0.metersCount) })
                    .accessibilityIdentifier("settingsStatus_metersCount")
                statusLine("rate_limited", value: viewModel.status.map { $0.isRateLimited ? "true" : "false" })
                    .accessibilityIdentifier("settingsStatus_rateLimited")
                statusLine("backoff_remaining", value: viewModel.status.map { "\($0.backoffRemaining) s" })
                    .accessibilityIdentifier("settingsStatus_backoffRemaining")
                statusLine("last_api_call", value: lastCall)
                    .accessibilityIdentifier("settingsStatus_lastApiCall")
                statusLine("collection_interval", value: viewModel.status.map { "\($0.collectionInterval) s" })
                    .accessibilityIdentifier("settingsStatus_collectionInterval")
                if let error = viewModel.statusError { Text(verbatim: error).foregroundStyle(.red) }
                Button(L10n.text("reload_status")) { Task { await viewModel.reloadStatus() } }
                    .accessibilityIdentifier("reloadStatusButton")
            }
            if !environment.isMockMode && environment.dataSource == .standalone {
                Section(L10n.text("switchbot_credentials")) {
                    SecureField(L10n.text("switchbot_token"), text: $viewModel.token)
                        .textInputAutocapitalization(.never)
                        .accessibilityIdentifier("switchbotTokenField")
                    SecureField(L10n.text("switchbot_secret"), text: $viewModel.secret)
                        .textInputAutocapitalization(.never)
                        .accessibilityIdentifier("switchbotSecretField")
                    Text(verbatim: viewModel.credentialsState).accessibilityIdentifier("credentialsState")
                    Button(L10n.text("save_credentials")) { viewModel.saveCredentials() }
                        .accessibilityIdentifier("saveCredentialsButton")
                    Button(L10n.text("clear_credentials"), role: .destructive) { viewModel.clearCredentials() }
                        .accessibilityIdentifier("clearCredentialsButton")
                }
            }
        }
        .navigationTitle(L10n.text("tab_settings"))
        .task { await viewModel.reloadStatus() }
        .onChange(of: viewModel.customURL) { _, value in
            guard viewModel.backendChoice == .custom, SettingsViewModel.isAllowedBackendURL(value) else { return }
            viewModel.applyCustomURL()
        }
    }

    @ViewBuilder
    private func statusLine(_ key: String, value: String?) -> some View {
        if let value {
            LabeledContent(L10n.text(key), value: value)
        } else {
            LabeledContent(L10n.text(key), value: "-")
        }
    }

    private var lastCall: String? {
        guard let seconds = viewModel.status?.lastApiCall else { return nil }
        return DateFormatter.localizedString(from: Date(timeIntervalSince1970: seconds), dateStyle: .short, timeStyle: .medium)
    }
}
