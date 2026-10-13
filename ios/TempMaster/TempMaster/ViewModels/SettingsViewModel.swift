import Foundation
import Combine

enum BackendChoice: String, CaseIterable, Identifiable {
    case production
    case custom
    var id: String { rawValue }
}

@MainActor
final class SettingsViewModel: ObservableObject {
    @Published var backendChoice: BackendChoice
    @Published var customURL: String
    @Published var token = ""
    @Published var secret = ""
    @Published private(set) var credentialsState: String
    @Published private(set) var customURLError: String?
    @Published private(set) var connectionTestResult: String?
    @Published private(set) var status: StatusResponse?
    @Published private(set) var statusError: String?
    private let environment: AppEnvironment

    init(environment: AppEnvironment) {
        self.environment = environment
        backendChoice = environment.usesCustomBackend ? .custom : .production
        customURL = environment.customBackendURL
        if environment.isMockMode {
            credentialsState = L10n.text("credentials_not_set")
        } else {
            credentialsState = environment.keychain.read(account: "token") != nil && environment.keychain.read(account: "secret") != nil
                ? L10n.text("credentials_saved") : L10n.text("credentials_not_set")
        }
    }

    func selectDataSource(_ source: DataSource) {
        environment.setDataSource(source)
        Task { await reloadStatus() }
    }

    func selectBackend(_ choice: BackendChoice) {
        backendChoice = choice
        customURLError = nil
        if choice == .production {
            environment.setBackend(useCustom: false)
            Task { await reloadStatus() }
        } else {
            applyCustomURL()
        }
    }

    func applyCustomURL() {
        let trimmedURL = customURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard BackendURLPolicy.isAllowed(trimmedURL) else {
            customURLError = L10n.text("invalid_backend_url")
            return
        }
        customURL = trimmedURL
        customURLError = nil
        environment.setBackend(useCustom: true, customURL: trimmedURL)
        Task { await reloadStatus() }
    }

    static func isAllowedBackendURL(_ value: String) -> Bool {
        BackendURLPolicy.isAllowed(value)
    }

    func testConnection() async {
        do {
            let response = try await environment.service.healthz()
            connectionTestResult = L10n.format("connection_ok", response.status)
        } catch {
            connectionTestResult = L10n.format("connection_failed", error.localizedDescription)
        }
    }

    func reloadStatus() async {
        do {
            status = try await environment.service.fetchStatus()
            statusError = nil
        } catch {
            statusError = error.localizedDescription
        }
    }

    func saveCredentials() {
        guard !environment.isMockMode else { return }
        do {
            try environment.keychain.save(token, account: "token")
            try environment.keychain.save(secret, account: "secret")
            token = ""
            secret = ""
            credentialsState = L10n.text("credentials_saved")
            if environment.dataSource == .standalone {
                Task {
                    await environment.collectStandalone()
                    NotificationCenter.default.post(name: AppEnvironment.dashboardReloadNotification, object: nil)
                }
            }
        } catch {
            credentialsState = error.localizedDescription
        }
    }

    func clearCredentials() {
        guard !environment.isMockMode else { return }
        do {
            try environment.keychain.delete(account: "token")
            try environment.keychain.delete(account: "secret")
            token = ""
            secret = ""
            credentialsState = L10n.text("credentials_not_set")
        } catch {
            credentialsState = error.localizedDescription
        }
    }
}
