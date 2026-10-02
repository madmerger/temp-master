import Foundation

/// Owns the current MeterService; rebuilds it when settings/credentials
/// change and triggers a dashboard reload via `serviceVersion`.
@MainActor
final class AppEnvironment: ObservableObject {
    @Published private(set) var service: any MeterService
    @Published private(set) var serviceVersion = 0

    let settings: AppSettings
    private var localService: LocalMeterService?

    init(settings: AppSettings = .shared) {
        self.settings = settings
        AppSettings.applyEnvCredentialsIfRequested()
        var local: LocalMeterService?
        service = Self.build(settings: settings, localService: &local)
        localService = local
    }

    /// Rebuild the active service (settings change or credential save).
    func rebuild() {
        localService?.stopPeriodicCollection()
        var local: LocalMeterService?
        service = Self.build(settings: settings, localService: &local)
        localService = local
        serviceVersion += 1
    }

    private static func build(settings: AppSettings,
                              localService: inout LocalMeterService?) -> any MeterService {
        if AppSettings.useMockData {
            return MockMeterService()
        }
        switch settings.dataSource {
        case .remote:
            return RemoteMeterService(baseURL: settings.backendURL)
        case .standalone:
            let dbPath = Self.databasePath()
            guard let store = try? SQLiteStore(path: dbPath) else {
                return RemoteMeterService(baseURL: settings.backendURL)
            }
            let client = SwitchBotClient(
                credentials: { KeychainStore.credentials() },
                session: .shared,
                store: store)
            let local = LocalMeterService(store: store, client: client)
            localService = local
            try? local.cleanupOldData()
            if KeychainStore.credentials() != nil {
                local.startPeriodicCollection()
            }
            return local
        }
    }

    private static func databasePath() -> String {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory,
                                           in: .userDomainMask).first!
            .appendingPathComponent("TempMaster", isDirectory: true)
        return dir.appendingPathComponent("app.db").path
    }
}
