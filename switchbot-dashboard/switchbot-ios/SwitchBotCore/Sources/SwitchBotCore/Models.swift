import Foundation

public struct Meter: Codable, Equatable, Sendable {
    public let deviceID: String
    public let deviceName: String
    public let deviceType: String
    public let hubDeviceID: String?
    public let currentTemperature: Double?
    public let currentHumidity: Int?
    public let battery: Int?
    public let lastUpdated: Date?

    public init(
        deviceID: String,
        deviceName: String,
        deviceType: String,
        hubDeviceID: String? = nil,
        currentTemperature: Double? = nil,
        currentHumidity: Int? = nil,
        battery: Int? = nil,
        lastUpdated: Date? = nil
    ) {
        self.deviceID = deviceID
        self.deviceName = deviceName
        self.deviceType = deviceType
        self.hubDeviceID = hubDeviceID
        self.currentTemperature = currentTemperature
        self.currentHumidity = currentHumidity
        self.battery = battery
        self.lastUpdated = lastUpdated
    }

    private enum CodingKeys: String, CodingKey {
        case deviceID = "device_id"
        case deviceName = "device_name"
        case deviceType = "device_type"
        case hubDeviceID = "hub_device_id"
        case currentTemperature = "current_temperature"
        case currentHumidity = "current_humidity"
        case battery
        case lastUpdated = "last_updated"
    }
}

public struct MetersResponse: Codable, Equatable, Sendable {
    public let meters: [Meter]
    public let lastUpdated: Date?

    public init(meters: [Meter], lastUpdated: Date? = nil) {
        self.meters = meters
        self.lastUpdated = lastUpdated
    }

    private enum CodingKeys: String, CodingKey {
        case meters
        case lastUpdated = "last_updated"
    }
}

public struct StatusResponse: Codable, Equatable, Sendable {
    public let configured: Bool
    public let metersCount: Int
    public let isRateLimited: Bool
    public let backoffRemaining: Int
    public let lastAPICall: Double
    public let collectionInterval: Int

    public init(
        configured: Bool,
        metersCount: Int,
        isRateLimited: Bool,
        backoffRemaining: Int,
        lastAPICall: Double,
        collectionInterval: Int
    ) {
        self.configured = configured
        self.metersCount = metersCount
        self.isRateLimited = isRateLimited
        self.backoffRemaining = backoffRemaining
        self.lastAPICall = lastAPICall
        self.collectionInterval = collectionInterval
    }

    private enum CodingKeys: String, CodingKey {
        case configured
        case metersCount = "meters_count"
        case isRateLimited = "is_rate_limited"
        case backoffRemaining = "backoff_remaining"
        case lastAPICall = "last_api_call"
        case collectionInterval = "collection_interval"
    }
}

public struct HistoryResponse: Codable, Equatable, Sendable {
    public let deviceID: String
    public let timeScale: String
    public let history: [MeterReading]
    public let device: Meter?

    public init(deviceID: String, timeScale: String, history: [MeterReading], device: Meter? = nil) {
        self.deviceID = deviceID
        self.timeScale = timeScale
        self.history = history
        self.device = device
    }

    private enum CodingKeys: String, CodingKey {
        case deviceID = "device_id"
        case timeScale = "time_scale"
        case history
        case device
    }
}

public struct MeterReading: Codable, Equatable, Sendable {
    public let timestamp: Date
    public let temperature: Double
    public let humidity: Int
    public let battery: Int?

    public init(timestamp: Date, temperature: Double, humidity: Int, battery: Int? = nil) {
        self.timestamp = timestamp
        self.temperature = temperature
        self.humidity = humidity
        self.battery = battery
    }

    private enum CodingKeys: String, CodingKey {
        case timestamp
        case temperature
        case humidity
        case battery
    }
}

public struct RefreshResponse: Codable, Equatable, Sendable {
    public let status: String
    public let message: String?
    public let metersCount: Int

    public init(status: String, message: String? = nil, metersCount: Int) {
        self.status = status
        self.message = message
        self.metersCount = metersCount
    }

    private enum CodingKeys: String, CodingKey {
        case status
        case message
        case metersCount = "meters_count"
    }
}

public enum DashboardJSON {
    public static func decoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)
            let hasTimeZone = value.hasSuffix("Z")
                || value.range(of: #"[+-]\d{2}:\d{2}$"#, options: .regularExpression) != nil
            let normalized = hasTimeZone ? value : "\(value)Z"

            for options in [
                ISO8601DateFormatter.Options.withInternetDateTime.union(.withFractionalSeconds),
                .withInternetDateTime,
            ] {
                let formatter = ISO8601DateFormatter()
                formatter.formatOptions = options
                if let date = formatter.date(from: normalized) {
                    return date
                }
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Invalid ISO-8601 date: \(value)"
            )
        }
        return decoder
    }
}
