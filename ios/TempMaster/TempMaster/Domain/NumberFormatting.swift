import Foundation

/// B-03: JavaScript Number -> String equivalent.
/// Integral values (|x| < 1e15) print with no decimal ("19" for 19.0);
/// otherwise the shortest round-trip representation ("22.3").
enum NumberFormatting {
    static func jsString(_ value: Double) -> String {
        if value == value.rounded(), abs(value) < 1e15 {
            return String(Int64(value))
        }
        return "\(value)"
    }
}
