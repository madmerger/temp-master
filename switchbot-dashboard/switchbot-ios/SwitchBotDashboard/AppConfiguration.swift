import Foundation
import SwitchBotCore

enum AppConfiguration {
    static func makeViewModel() -> DashboardViewModel {
        let arguments = ProcessInfo.processInfo.arguments
        let mockMode = arguments.contains("-UITestMockData")
        let scenarioNow = date("2026-11-02T09:00:00Z")
        let api: any DashboardAPI
        let now: () -> Date

        if mockMode, let scenarioNow {
            api = MockDashboardAPI(now: scenarioNow)
            now = { scenarioNow }
        } else {
            let baseURL = apiBaseURL(arguments: arguments)
            api = URLSessionDashboardAPI(baseURL: baseURL)
            now = Date.init
        }

        return DashboardViewModel(
            api: api,
            now: now,
            displayNames: loadDisplayNames()
        )
    }

    private static func apiBaseURL(arguments: [String]) -> URL {
        if let index = arguments.firstIndex(of: "-APIBaseURL"),
           arguments.indices.contains(index + 1),
           let url = URL(string: arguments[index + 1]) {
            return url
        }
        return URL(string: "https://snakeroom.fly.dev")!
    }

    private static func loadDisplayNames() -> DisplayNameMap {
        guard let url = Bundle.main.url(forResource: "display_names", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let map = try? DisplayNameMap(data: data) else {
            return DisplayNameMap(names: [:])
        }
        return map
    }

    private static func date(_ value: String) -> Date? {
        ISO8601DateFormatter().date(from: value)
    }
}
