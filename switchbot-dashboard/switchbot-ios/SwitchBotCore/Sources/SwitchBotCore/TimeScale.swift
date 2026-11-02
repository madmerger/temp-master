import Foundation

public enum TimeScale: String, CaseIterable, Codable, Sendable {
    case hour
    case day
    case week
    case month
    case year

    public var displayLabel: String {
        switch self {
        case .hour: "Last Hour"
        case .day: "Last 24 Hours"
        case .week: "Last 7 Days"
        case .month: "Last 30 Days"
        case .year: "Last Year"
        }
    }
}
