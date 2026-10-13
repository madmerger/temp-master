import SwiftUI

@main
struct TempMasterApp: App {
    @StateObject private var environment = AppEnvironment()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootTabView(environment: environment)
                .environmentObject(environment)
                .task(id: "\(scenePhase == .active)-\(environment.dataSource.rawValue)") {
                    guard scenePhase == .active else { return }
                    await environment.collectStandalone()
                    while scenePhase == .active {
                        try? await Task.sleep(for: .seconds(3600))
                        guard !Task.isCancelled else { return }
                        await environment.collectStandalone()
                    }
                }
        }
    }
}
