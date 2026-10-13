import Foundation

/// B-02: a meter is stale when lastUpdated is nil or >= 7 days old.
enum StaleMeterPolicy {
    static let threshold: TimeInterval = 7 * 24 * 60 * 60

    static func isStale(lastUpdated: Date?, now: Date = Date()) -> Bool {
        guard let lastUpdated else { return true }
        return now.timeIntervalSince(lastUpdated) >= threshold
    }

    static func partition(_ meters: [MeterDevice],
                          now: Date = Date()) -> (active: [MeterDevice], stale: [MeterDevice]) {
        var active: [MeterDevice] = []
        var stale: [MeterDevice] = []
        for meter in meters {
            if isStale(lastUpdated: meter.lastUpdated, now: now) {
                stale.append(meter)
            } else {
                active.append(meter)
            }
        }
        return (active, stale)
    }
}
