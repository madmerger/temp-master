import SwiftUI

@main
struct SwitchBotDashboardApp: App {
    @StateObject private var viewModel: DashboardViewModel

    init() {
        _viewModel = StateObject(wrappedValue: AppConfiguration.makeViewModel())
    }

    var body: some Scene {
        WindowGroup {
            DashboardView(viewModel: viewModel)
        }
    }
}
