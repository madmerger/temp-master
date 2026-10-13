import Foundation

enum ISO8601Parsing {
    private static let expression = try! NSRegularExpression(
        pattern: #"^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})?$"#
    )

    static func parse(_ value: String) -> Date? {
        let range = NSRange(value.startIndex..<value.endIndex, in: value)
        guard let match = expression.firstMatch(in: value, range: range) else { return nil }
        func group(_ index: Int) -> String? {
            guard let range = Range(match.range(at: index), in: value) else { return nil }
            return String(value[range])
        }
        guard let year = group(1).flatMap(Int.init),
              let month = group(2).flatMap(Int.init),
              let day = group(3).flatMap(Int.init),
              let hour = group(4).flatMap(Int.init),
              let minute = group(5).flatMap(Int.init),
              let second = group(6).flatMap(Int.init) else { return nil }
        let fraction = group(7).map { Double("0.\($0)") ?? 0 } ?? 0
        var components = DateComponents()
        components.calendar = Calendar(identifier: .gregorian)
        components.timeZone = TimeZone(secondsFromGMT: 0)
        components.year = year
        components.month = month
        components.day = day
        components.hour = hour
        components.minute = minute
        components.second = second
        guard let localAsUTC = components.date else { return nil }

        let suffix = group(8) ?? "Z"
        var offset = 0
        if suffix != "Z" {
            let sign = suffix.hasPrefix("-") ? -1 : 1
            let digits = suffix.dropFirst().split(separator: ":")
            guard digits.count == 2, let hours = Int(digits[0]), let minutes = Int(digits[1]),
                  hours <= 23, minutes <= 59 else { return nil }
            offset = sign * (hours * 3600 + minutes * 60)
        }
        return localAsUTC.addingTimeInterval(fraction - TimeInterval(offset))
    }

    static func encode(_ date: Date) -> String {
        let seconds = date.timeIntervalSince1970
        var wholeSeconds = floor(seconds)
        var microseconds = Int(((seconds - wholeSeconds) * 1_000_000).rounded())
        if microseconds >= 1_000_000 {
            wholeSeconds += 1
            microseconds = 0
        }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        let timestamp = formatter.string(from: Date(timeIntervalSince1970: wholeSeconds))
        return "\(timestamp).\(String(format: "%06d", microseconds))+00:00"
    }

    static func queryString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        return formatter.string(from: date)
    }
}
