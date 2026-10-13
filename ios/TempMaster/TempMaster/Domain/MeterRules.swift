import Foundation

enum MeterRules {
    static let staleThreshold: TimeInterval = 604_800

    static func isStale(_ meter: MeterDevice, now: Date) -> Bool {
        isStale(lastUpdated: meter.lastUpdated, now: now)
    }

    static func isStale(lastUpdated: Date?, now: Date) -> Bool {
        guard let lastUpdated else { return true }
        return now.timeIntervalSince(lastUpdated) >= staleThreshold
    }

    static func isStale(lastUpdatedRaw: String?, now: Date) -> Bool {
        isStale(lastUpdated: lastUpdatedRaw.flatMap(ISO8601Parsing.parse), now: now)
    }

    static func lastUpdatedDisplayValue(raw: String?) -> String? {
        guard let raw else { return nil }
        guard let date = ISO8601Parsing.parse(raw) else { return "Invalid Date" }
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .medium
        return formatter.string(from: date)
    }

    static func numberString(_ number: Double) -> String {
        if number == 0 { return "0" }
        if number.isFinite, number.rounded(.towardZero) == number,
           number >= Double(Int64.min), number < Double(Int64.max) {
            return String(Int64(number))
        }
        return String(number)
    }

    static func formatLabel(_ date: Date, scale: TimeScale, timeZone: TimeZone = .current) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = timeZone
        switch scale {
        case .hour, .day: formatter.dateFormat = "HH:mm"
        case .week: formatter.dateFormat = "EEE HH"
        case .month, .year: formatter.dateFormat = "MMM d"
        }
        return formatter.string(from: date)
    }

    static func labelIndices(count: Int, maximum: Int = 8) -> [Int] {
        guard count > 0, maximum > 0 else { return [] }
        let strideSize = max(1, Int(ceil(Double(count) / Double(maximum))))
        return Array(Swift.stride(from: 0, to: count, by: strideSize))
    }
}
