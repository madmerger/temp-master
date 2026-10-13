import SwiftUI

struct RootTabView: View {
    @EnvironmentObject private var environment: AppEnvironment

    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("tab.dashboard".localized, systemImage: "thermometer")
                }
            LatencyView()
                .tabItem {
                    Label("tab.latency".localized, systemImage: "clock")
                }
            ImportView()
                .tabItem {
                    Label("tab.import".localized, systemImage: "square.and.arrow.down")
                }
            SettingsView()
                .tabItem {
                    Label("tab.settings".localized, systemImage: "gear")
                }
        }
    }
}
