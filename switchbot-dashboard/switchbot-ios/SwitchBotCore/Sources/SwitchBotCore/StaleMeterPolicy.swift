import Foundation

public enum StaleMeterPolicy {
    public static let threshold: TimeInterval = 7 * 24 * 60 * 60

    public static func isStale(
        lastUpdated: Date?,
        now: Date,
        threshold: TimeInterval = StaleMeterPolicy.threshold
    ) -> Bool {
        guard let lastUpdated else {
            return true
        }
        return now.timeIntervalSince(lastUpdated) >= threshold
    }
}
