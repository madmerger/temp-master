import Foundation

public enum ChartLabelFormatter {
    public static func format(_ date: Date, timeScale: TimeScale, timeZone: TimeZone = .current) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = timeZone
        switch timeScale {
        case .hour, .day:
            formatter.dateFormat = "HH:mm"
        case .week:
            formatter.dateFormat = "EEE HH"
        case .month, .year:
            formatter.dateFormat = "MMM d"
        }
        return formatter.string(from: date)
    }
}
