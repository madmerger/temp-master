import Foundation

/// B-05: X-axis label formats matching the legacy formatTimestamp():
/// hour/day "HH:mm", week "EEE HH", month/year "MMM d" (en_US_POSIX names).
enum ChartLabelFormatter {
    private static func formatter(_ format: String, timeZone: TimeZone) -> DateFormatter {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = timeZone
        f.dateFormat = format
        return f
    }

    static func label(for date: Date, scale: TimeScale,
                      timeZone: TimeZone = .current) -> String {
        switch scale {
        case .hour, .day:
            return formatter("HH:mm", timeZone: timeZone).string(from: date)
        case .week:
            return formatter("EEE HH", timeZone: timeZone).string(from: date)
        case .month, .year:
            return formatter("MMM d", timeZone: timeZone).string(from: date)
        }
    }
}
