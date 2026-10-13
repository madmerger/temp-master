import Foundation

/// ISO-8601 coding matching Python isoformat: decode accepts 0–6 fractional
/// digits and `Z` or `±HH:MM` offsets; encode emits UTC
/// `yyyy-MM-dd'T'HH:mm:ss.SSSSSS+00:00`. The same format is used for SQLite
/// TEXT timestamps so lexicographic comparison works like the legacy DB.
enum JSONCoding {
    private static let pattern = try! NSRegularExpression(
        pattern: #"^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$"#)

    static func parse(_ string: String) -> Date? {
        let range = NSRange(string.startIndex..., in: string)
        guard let m = pattern.firstMatch(in: string, range: range) else { return nil }
        func int(_ i: Int) -> Int {
            Int(String(string[Range(m.range(at: i), in: string)!])) ?? 0
        }
        var secondsFromGMT = 0
        let offset = String(string[Range(m.range(at: 8), in: string)!])
        if offset != "Z" {
            let sign = offset.hasPrefix("+") ? 1 : -1
            let parts = offset.dropFirst().split(separator: ":")
            secondsFromGMT = sign * (Int(parts[0])! * 3600 + Int(parts[1])! * 60)
        }
        var nanos = 0
        if m.range(at: 7).location != NSNotFound {
            var frac = String(string[Range(m.range(at: 7), in: string)!])
            while frac.count < 6 { frac += "0" }
            nanos = (Int(frac) ?? 0) * 1000
        }
        var comps = DateComponents()
        comps.calendar = Calendar(identifier: .gregorian)
        comps.timeZone = TimeZone(secondsFromGMT: 0)
        comps.year = int(1); comps.month = int(2); comps.day = int(3)
        comps.hour = int(4); comps.minute = int(5); comps.second = int(6)
        comps.nanosecond = nanos
        guard let base = comps.date else { return nil }
        return base.addingTimeInterval(-TimeInterval(secondsFromGMT))
    }

    static func format(_ date: Date) -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(secondsFromGMT: 0)!
        let c = cal.dateComponents([.year, .month, .day, .hour, .minute, .second, .nanosecond],
                                   from: date)
        return String(format: "%04d-%02d-%02dT%02d:%02d:%02d.%06d+00:00",
                      c.year!, c.month!, c.day!, c.hour!, c.minute!, c.second!,
                      (c.nanosecond ?? 0) / 1000)
    }

    static func decoder() -> JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let s = try container.decode(String.self)
            guard let date = parse(s) else {
                throw DecodingError.dataCorruptedError(
                    in: container, debugDescription: "Invalid ISO-8601 date: \(s)")
            }
            return date
        }
        return d
    }

    static func encoder() -> JSONEncoder {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(format(date))
        }
        return e
    }
}
