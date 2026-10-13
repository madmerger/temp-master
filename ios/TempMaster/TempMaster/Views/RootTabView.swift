import SwiftUI

struct RootTabView: View {
    @ObservedObject private var environment: AppEnvironment
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var dashboard: DashboardViewModel
    @StateObject private var latency: LatencyViewModel
    @StateObject private var importer: ImportViewModel
    @StateObject private var settings: SettingsViewModel
    @State private var selection: String

    init(environment: AppEnvironment) {
        self.environment = environment
        _dashboard = StateObject(wrappedValue: DashboardViewModel(service: environment.service))
        _latency = StateObject(wrappedValue: LatencyViewModel(service: environment.service))
        _importer = StateObject(wrappedValue: ImportViewModel(service: environment.service))
        _settings = StateObject(wrappedValue: SettingsViewModel(environment: environment))
        let args = ProcessInfo.processInfo.arguments
        let initial = args.firstIndex(of: "-UITestInitialTab").flatMap { args.indices.contains($0 + 1) ? args[$0 + 1] : nil } ?? "dashboard"
        _selection = State(initialValue: ["dashboard", "latency", "import", "settings"].contains(initial) ? initial : "dashboard")
    }

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack { DashboardView(viewModel: dashboard, isActive: selection == "dashboard" && scenePhase == .active) }
                .tabItem { Label(L10n.text("tab_dashboard"), systemImage: "thermometer") }
                .tag("dashboard")
            NavigationStack { LatencyView(viewModel: latency) }
                .tabItem { Label(L10n.text("tab_latency"), systemImage: "waveform.path") }
                .tag("latency")
            NavigationStack { ImportView(viewModel: importer) }
                .tabItem { Label(L10n.text("tab_import"), systemImage: "square.and.arrow.down") }
                .tag("import")
            NavigationStack { SettingsView(viewModel: settings) }
                .tabItem { Label(L10n.text("tab_settings"), systemImage: "gearshape") }
                .tag("settings")
        }
        .onChange(of: environment.revision) { _, _ in
            dashboard.setService(environment.service)
            latency.setService(environment.service)
            importer.setService(environment.service)
        }
        .onReceive(NotificationCenter.default.publisher(for: AppEnvironment.dashboardReloadNotification)) { _ in
            Task { await dashboard.reloadAfterImport() }
        }
    }
}
