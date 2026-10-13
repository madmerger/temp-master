import Foundation

/// B-09: exponential backoff min(60 * 2^errors, 600).
enum BackoffPolicy {
    static let base: Int = 60
    static let maxBackoff: Int = 600

    static func delay(consecutiveErrors: Int) -> Int {
        min(base * (1 << max(0, consecutiveErrors)), maxBackoff)
    }
}
