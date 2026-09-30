import Foundation

@MainActor
final class SettingsViewModel: ObservableObject {
    @Published var mode: DataSourceMode
    @Published var backendURLText: String
    @Published var token = ""
    @Published var secret = ""
    @Published private(set) var hasCredentials = KeychainStore.credentials() != nil
    @Published private(set) var testResult: String?
    @Published private(set) var testInFlight = false
    @Published private(set) var status: ServiceStatus?

    var environment: AppEnvironment
    private var settings: AppSettings

    init(environment: AppEnvironment) {
        self.environment = environment
        self.settings = environment.settings
        self.mode = settings.dataSource
        self.backendURLText = settings.backendURL.absoluteString
    }

    /// Resync view fields after the environment (service) is rebuilt.
    func reloadFromEnvironment() {
        settings = environment.settings
        mode = settings.dataSource
        backendURLText = settings.backendURL.absoluteString
        hasCredentials = KeychainStore.credentials() != nil
    }

    var isBackendURLValid: Bool {
        guard let url = URL(string: backendURLText),
              let scheme = url.scheme?.lowercased(),
              scheme == "http" || scheme == "https",
              url.host != nil else { return false }
        return true
    }

    /// Apply mode + URL, rebuild the service, and trigger dashboard reload.
    func applySettings() {
        settings.dataSource = mode
        if let url = URL(string: backendURLText), isBackendURLValid {
            settings.backendURL = url
        }
        environment.rebuild()
    }

    func saveCredentials() {
        guard !token.isEmpty, !secret.isEmpty else { return }
        KeychainStore.save(token, for: .token)
        KeychainStore.save(secret, for: .secret)
        token = ""
        secret = ""
        hasCredentials = true
        environment.rebuild()
    }

    func clearCredentials() {
        KeychainStore.delete(.token)
        KeychainStore.delete(.secret)
        hasCredentials = false
        environment.rebuild()
    }

    func testConnection() async {
        testInFlight = true
        defer { testInFlight = false }
        do {
            testResult = (try await environment.service.healthCheck()) ? "OK" : "Error"
        } catch {
            testResult = error.localizedDescription
        }
    }

    func loadStatus() async {
        status = try? await environment.service.fetchStatus()
    }
}
