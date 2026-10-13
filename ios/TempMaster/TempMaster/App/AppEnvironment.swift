import Foundation
import Combine

enum DataSource: String, CaseIterable, Identifiable {
    case remote
    case standalone
    var id: String { rawValue }
}

@MainActor
final class AppEnvironment: ObservableObject {
    static let productionBackendURL = "https://snakeroom.fly.dev"
    static let dashboardReloadNotification = Notification.Name("TempMasterDashboardReload")

    @Published private(set) var service: any MeterService
    @Published private(set) var revision = 0
    @Published var dataSource: DataSource
    @Published var backendURL: String
    @Published var customBackendURL: String
    @Published var usesCustomBackend = false

    let isMockMode: Bool
    let defaults: UserDefaults
    let keychain: CredentialsProviding
    private let mockService: MockMeterService?
    private let session: URLSession
    private var standaloneService: StandaloneMeterService?

    init(
        arguments: [String] = ProcessInfo.processInfo.arguments,
        defaults: UserDefaults = .standard,
        keychain: CredentialsProviding = KeychainStore(),
        session: URLSession = .shared
    ) {
        isMockMode = arguments.contains("-UITestMockData")
        self.keychain = keychain
        self.session = session
        if isMockMode {
            let suite = UserDefaults(suiteName: "TempMaster.UITestMockData")!
            suite.removePersistentDomain(forName: "TempMaster.UITestMockData")
            self.defaults = suite
            let mock = MockMeterService(arguments: arguments)
            mockService = mock
            dataSource = .remote
            backendURL = Self.productionBackendURL
            customBackendURL = ""
            service = mock
            return
        }
        self.defaults = defaults
        mockService = nil
        let selected = DataSource(rawValue: defaults.string(forKey: "dataSource") ?? "remote") ?? .remote
        let custom = defaults.string(forKey: "customBackendURL") ?? Self.productionBackendURL
        let useCustom = defaults.bool(forKey: "usesCustomBackend")
        let url = useCustom ? custom : Self.productionBackendURL
        dataSource = selected
        backendURL = url
        customBackendURL = custom
        usesCustomBackend = useCustom
        if selected == .standalone, let store = Self.makeStore() {
            let standalone = StandaloneMeterService(store: store, credentials: keychain, session: session)
            standaloneService = standalone
            service = standalone
        } else {
            service = (try? RemoteMeterService(baseURL: url, session: session)) ?? UnavailableMeterService()
        }
    }

    func setDataSource(_ value: DataSource) {
        guard !isMockMode else { return }
        dataSource = value
        defaults.set(value.rawValue, forKey: "dataSource")
        rebuildService()
    }

    func setBackend(useCustom: Bool, customURL: String? = nil) {
        guard !isMockMode else { return }
        if let customURL { self.customBackendURL = customURL }
        usesCustomBackend = useCustom
        backendURL = useCustom ? customBackendURL : Self.productionBackendURL
        defaults.set(useCustom, forKey: "usesCustomBackend")
        defaults.set(customBackendURL, forKey: "customBackendURL")
        rebuildService()
    }

    func rebuildService() {
        guard !isMockMode else { return }
        if dataSource == .standalone {
            if standaloneService == nil, let store = Self.makeStore() {
                standaloneService = StandaloneMeterService(store: store, credentials: keychain, session: session)
            }
            if let standaloneService { service = standaloneService }
        } else {
            service = (try? RemoteMeterService(baseURL: backendURL, session: session)) ?? UnavailableMeterService()
        }
        revision += 1
    }

    func collectStandalone() async {
        guard !isMockMode, dataSource == .standalone else { return }
        await standaloneService?.collect()
    }

    private static func makeStore() -> SQLiteStore? {
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        return try? SQLiteStore(url: support.appendingPathComponent("TempMaster/app.db"))
    }
}
