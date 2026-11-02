import Foundation

public struct MockDashboardAPI: DashboardAPI {
    public static let activeDeviceIDs = [
        "C76B0046301A",
        "D13234351576",
        "B0E9FEB9CFA6",
        "A1B2C3D4E5F6",
    ]

    public static let staleDeviceIDs = [
        "F577B677EC96",
        "000000000000",
    ]

    private let now: Date
    private let metersResponse: MetersResponse

    public init(now: Date) {
        self.now = now
        metersResponse = MetersResponse(
            meters: [
                Meter(
                    deviceID: Self.activeDeviceIDs[0],
                    deviceName: "Bedroom Meter",
                    deviceType: "MeterPlus",
                    currentTemperature: 20.0,
                    currentHumidity: 71,
                    battery: 20,
                    lastUpdated: now.addingTimeInterval(-2 * 60)
                ),
                Meter(
                    deviceID: Self.activeDeviceIDs[1],
                    deviceName: "アワコ",
                    deviceType: "Meter",
                    currentTemperature: 26.8,
                    currentHumidity: 68,
                    battery: 100,
                    lastUpdated: now.addingTimeInterval(-2 * 60)
                ),
                Meter(
                    deviceID: Self.activeDeviceIDs[2],
                    deviceName: "Livingroom Hub",
                    deviceType: "Hub 3",
                    hubDeviceID: "",
                    currentTemperature: 18.9,
                    currentHumidity: 65,
                    battery: nil,
                    lastUpdated: now.addingTimeInterval(-2 * 60)
                ),
                Meter(
                    deviceID: Self.activeDeviceIDs[3],
                    deviceName: "Garage Sensor",
                    deviceType: "Meter",
                    currentTemperature: 15.2,
                    currentHumidity: 55,
                    battery: 80,
                    lastUpdated: now.addingTimeInterval(-60 * 60)
                ),
                Meter(
                    deviceID: Self.staleDeviceIDs[0],
                    deviceName: "夢男",
                    deviceType: "Meter",
                    currentTemperature: 24.1,
                    currentHumidity: 85,
                    battery: 100,
                    lastUpdated: Self.date("2026-02-09T02:13:39Z")
                ),
                Meter(
                    deviceID: Self.staleDeviceIDs[1],
                    deviceName: "Unknown Meter",
                    deviceType: "Meter",
                    currentTemperature: nil,
                    currentHumidity: nil,
                    battery: nil,
                    lastUpdated: nil
                ),
            ],
            lastUpdated: now
        )
    }

    public func meters() async throws -> MetersResponse {
        metersResponse
    }

    public func status() async throws -> StatusResponse {
        StatusResponse(
            configured: true,
            metersCount: metersResponse.meters.count,
            isRateLimited: false,
            backoffRemaining: 0,
            lastAPICall: now.timeIntervalSince1970,
            collectionInterval: 120
        )
    }

    public func history(deviceID: String, timeScale: TimeScale) async throws -> HistoryResponse {
        let meter = metersResponse.meters.first { $0.deviceID == deviceID }
        let duration: TimeInterval
        switch timeScale {
        case .hour: duration = 60 * 60
        case .day: duration = 24 * 60 * 60
        case .week: duration = 7 * 24 * 60 * 60
        case .month: duration = 30 * 24 * 60 * 60
        case .year: duration = 365 * 24 * 60 * 60
        }
        let baseTemperature = meter?.currentTemperature ?? 20
        let rangeOffset = Double(TimeScale.allCases.firstIndex(of: timeScale) ?? 0) * 0.23
        let history = (0..<12).map { index in
            MeterReading(
                timestamp: now.addingTimeInterval(-duration + duration * Double(index) / 11),
                temperature: baseTemperature + sin(Double(index) * 0.72 + rangeOffset) * 0.4,
                humidity: meter?.currentHumidity ?? 60,
                battery: meter?.battery
            )
        }
        return HistoryResponse(
            deviceID: deviceID,
            timeScale: timeScale.rawValue,
            history: history,
            device: meter
        )
    }

    public func refresh() async throws -> RefreshResponse {
        RefreshResponse(status: "success", message: "Mock refresh complete", metersCount: metersResponse.meters.count)
    }

    private static func date(_ value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: value)
    }
}
