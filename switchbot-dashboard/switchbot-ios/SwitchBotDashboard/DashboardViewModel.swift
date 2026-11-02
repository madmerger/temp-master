import Foundation
import SwitchBotCore
import SwiftUI

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published private(set) var state = DashboardState()
    @Published private(set) var selectedTimeScale: TimeScale = .day

    let displayNames: DisplayNameMap
    private let controller: DashboardController

    init(api: any DashboardAPI, now: @escaping () -> Date, displayNames: DisplayNameMap) {
        controller = DashboardController(api: api, now: now)
        self.displayNames = displayNames
    }

    func load() async {
        state = await controller.load(timeScale: selectedTimeScale)
    }

    func refresh() async {
        state = await controller.refresh(timeScale: selectedTimeScale)
    }

    func selectTimeScale(_ timeScale: TimeScale) {
        guard selectedTimeScale != timeScale else {
            return
        }
        selectedTimeScale = timeScale
        Task {
            state = await controller.changeTimeScale(timeScale)
        }
    }

    func lastRefreshText(timeZone: TimeZone = .current) -> String? {
        guard let lastRefresh = state.lastRefresh else {
            return nil
        }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = timeZone
        formatter.dateFormat = "HH:mm:ss"
        return "Last refresh: \(formatter.string(from: lastRefresh))"
    }
}
