import Foundation

enum DataSourceMode: String, CaseIterable, Identifiable {
    case remote, standalone
    var id: String { rawValue }
    var labelKey: String { "settings.source.\(rawValue)" }
}

/// B-18: backend URL setting; UserDefaults reads the launch-argument domain,
/// so `-DataSource standalone -BackendURL http://localhost:8000` works.
final class AppSettings: @unchecked Sendable {
    static let shared = AppSettings()

    enum Key: String {
        case dataSource = "DataSource"
        case backendURL = "BackendURL"
    }

    static let defaultBackendURL = "https://snakeroom.fly.dev"

    private let defaults: UserDefaults
    init(defaults: UserDefaults = .standard) { self.defaults = defaults }

    var dataSource: DataSourceMode {
        get { DataSourceMode(rawValue: defaults.string(forKey: Key.dataSource.rawValue) ?? "remote") ?? .remote }
        set { defaults.set(newValue.rawValue, forKey: Key.dataSource.rawValue) }
    }

    var backendURL: URL {
        get {
            URL(string: defaults.string(forKey: Key.backendURL.rawValue)
                    ?? Self.defaultBackendURL) ?? URL(string: Self.defaultBackendURL)!
        }
        set { defaults.set(newValue.absoluteString, forKey: Key.backendURL.rawValue) }
    }

    // MARK: - launch arguments

    static var useMockData: Bool {
        ProcessInfo.processInfo.arguments.contains("-UITestMockData")
    }

    static var mockRateLimited: Bool {
        ProcessInfo.processInfo.arguments.contains("-MockRateLimited")
    }

    /// DEBUG only: `-SwitchBotCredentialsFromEnv` reads SWITCHBOT_TOKEN /
    /// SWITCHBOT_SECRET from the process environment and stores them in the
    /// Keychain once (for standalone smoke tests). Values are never logged.
    static func applyEnvCredentialsIfRequested() {
        #if DEBUG
        guard ProcessInfo.processInfo.arguments.contains("-SwitchBotCredentialsFromEnv")
        else { return }
        let env = ProcessInfo.processInfo.environment
        if let token = env["SWITCHBOT_TOKEN"], let secret = env["SWITCHBOT_SECRET"],
           !token.isEmpty, !secret.isEmpty {
            KeychainStore.save(token, for: .token)
            KeychainStore.save(secret, for: .secret)
        }
        #endif
    }
}
