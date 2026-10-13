import Foundation

enum TimeScale: String, CaseIterable, Codable, Identifiable, Sendable {
    case hour
    case day
    case week
    case month
    case year

    var id: String { rawValue }
    var cutoffSeconds: TimeInterval {
        switch self {
        case .hour: 3_600
        case .day: 86_400
        case .week: 604_800
        case .month: 2_592_000
        case .year: 31_536_000
        }
    }
}

struct HealthResponse: Codable, Sendable {
    let status: String
}

struct MeterReading: Codable, Equatable, Sendable {
    let timestamp: Date
    let temperature: Double
    let humidity: Int
    let battery: Int?

    enum CodingKeys: String, CodingKey { case timestamp, temperature, humidity, battery }
    init(timestamp: Date, temperature: Double, humidity: Int, battery: Int?) {
        self.timestamp = timestamp
        self.temperature = temperature
        self.humidity = humidity
        self.battery = battery
    }
    init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        let raw = try values.decode(String.self, forKey: .timestamp)
        guard let date = ISO8601Parsing.parse(raw) else {
            throw DecodingError.dataCorruptedError(forKey: .timestamp, in: values, debugDescription: "Invalid timestamp")
        }
        timestamp = date
        temperature = try values.decode(Double.self, forKey: .temperature)
        humidity = try values.decode(Int.self, forKey: .humidity)
        battery = try values.decodeIfPresent(Int.self, forKey: .battery)
    }
    func encode(to encoder: Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(ISO8601Parsing.encode(timestamp), forKey: .timestamp)
        try values.encode(temperature, forKey: .temperature)
        try values.encode(humidity, forKey: .humidity)
        try values.encodeIfPresent(battery, forKey: .battery)
    }
}

struct MeterDevice: Codable, Identifiable, Equatable, Sendable {
    let deviceId: String
    var deviceName: String
    var deviceType: String
    var hubDeviceId: String?
    var currentTemperature: Double?
    var currentHumidity: Int?
    var battery: Int?
    var lastUpdatedRaw: String?

    var id: String { deviceId }
    var lastUpdated: Date? { lastUpdatedRaw.flatMap(ISO8601Parsing.parse) }

    enum CodingKeys: String, CodingKey {
        case deviceId = "device_id"
        case deviceName = "device_name"
        case deviceType = "device_type"
        case hubDeviceId = "hub_device_id"
        case currentTemperature = "current_temperature"
        case currentHumidity = "current_humidity"
        case battery
        case lastUpdatedRaw = "last_updated"
    }

    init(
        deviceId: String,
        deviceName: String,
        deviceType: String,
        hubDeviceId: String? = nil,
        currentTemperature: Double? = nil,
        currentHumidity: Int? = nil,
        battery: Int? = nil,
        lastUpdatedRaw: String? = nil
    ) {
        self.deviceId = deviceId
        self.deviceName = deviceName
        self.deviceType = deviceType
        self.hubDeviceId = hubDeviceId
        self.currentTemperature = currentTemperature
        self.currentHumidity = currentHumidity
        self.battery = battery
        self.lastUpdatedRaw = lastUpdatedRaw
    }

    func encode(to encoder: Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(deviceId, forKey: .deviceId)
        try values.encode(deviceName, forKey: .deviceName)
        try values.encode(deviceType, forKey: .deviceType)
        try values.encodeIfPresent(hubDeviceId, forKey: .hubDeviceId)
        try values.encodeIfPresent(currentTemperature, forKey: .currentTemperature)
        try values.encodeIfPresent(currentHumidity, forKey: .currentHumidity)
        try values.encodeIfPresent(battery, forKey: .battery)
        try values.encodeIfPresent(lastUpdatedRaw, forKey: .lastUpdatedRaw)
    }
}

struct MetersResponse: Codable, Sendable {
    let meters: [MeterDevice]
    let lastUpdated: String?
    enum CodingKeys: String, CodingKey { case meters; case lastUpdated = "last_updated" }
}

struct HistoryResponse: Codable, Sendable {
    let history: [MeterReading]
}

struct RefreshResponse: Codable, Sendable {
    let status: String
    let message: String
    let metersCount: Int?
    enum CodingKeys: String, CodingKey { case status, message; case metersCount = "meters_count" }
}

struct StatusResponse: Codable, Sendable {
    let configured: Bool
    let metersCount: Int
    let isRateLimited: Bool
    let backoffRemaining: Int
    let lastApiCall: Double?
    let collectionInterval: Int
    enum CodingKeys: String, CodingKey {
        case configured
        case metersCount = "meters_count"
        case isRateLimited = "is_rate_limited"
        case backoffRemaining = "backoff_remaining"
        case lastApiCall = "last_api_call"
        case collectionInterval = "collection_interval"
    }
}

struct LatencyLog: Codable, Identifiable, Sendable {
    let id: Int?
    let endpoint: String
    let deviceId: String?
    let timestamp: Date
    let latencyMs: Double
    let statusCode: Int
    let success: Bool
    let errorMessage: String?
    enum CodingKeys: String, CodingKey {
        case id, endpoint, timestamp, success
        case deviceId = "device_id"
        case latencyMs = "latency_ms"
        case statusCode = "status_code"
        case errorMessage = "error_message"
    }
    init(id: Int? = nil, endpoint: String, deviceId: String? = nil, timestamp: Date, latencyMs: Double, statusCode: Int, success: Bool, errorMessage: String? = nil) {
        self.id = id
        self.endpoint = endpoint
        self.deviceId = deviceId
        self.timestamp = timestamp
        self.latencyMs = latencyMs
        self.statusCode = statusCode
        self.success = success
        self.errorMessage = errorMessage
    }
    init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        id = try values.decodeIfPresent(Int.self, forKey: .id)
        endpoint = try values.decode(String.self, forKey: .endpoint)
        deviceId = try values.decodeIfPresent(String.self, forKey: .deviceId)
        let raw = try values.decode(String.self, forKey: .timestamp)
        guard let date = ISO8601Parsing.parse(raw) else {
            throw DecodingError.dataCorruptedError(forKey: .timestamp, in: values, debugDescription: "Invalid timestamp")
        }
        timestamp = date
        latencyMs = try values.decode(Double.self, forKey: .latencyMs)
        statusCode = try values.decode(Int.self, forKey: .statusCode)
        success = try values.decode(Bool.self, forKey: .success)
        errorMessage = try values.decodeIfPresent(String.self, forKey: .errorMessage)
    }
    func encode(to encoder: Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encodeIfPresent(id, forKey: .id)
        try values.encode(endpoint, forKey: .endpoint)
        try values.encodeIfPresent(deviceId, forKey: .deviceId)
        try values.encode(ISO8601Parsing.encode(timestamp), forKey: .timestamp)
        try values.encode(latencyMs, forKey: .latencyMs)
        try values.encode(statusCode, forKey: .statusCode)
        try values.encode(success, forKey: .success)
        try values.encodeIfPresent(errorMessage, forKey: .errorMessage)
    }
}

struct LatencyLogsResponse: Codable, Sendable {
    let logs: [LatencyLog]
    let count: Int
}

struct LatencyStats: Codable, Sendable {
    let totalCalls: Int
    let avgLatencyMs: Double?
    let minLatencyMs: Double?
    let maxLatencyMs: Double?
    let successfulCalls: Int
    let failedCalls: Int
    let successRate: Double
    enum CodingKeys: String, CodingKey {
        case totalCalls = "total_calls"
        case avgLatencyMs = "avg_latency_ms"
        case minLatencyMs = "min_latency_ms"
        case maxLatencyMs = "max_latency_ms"
        case successfulCalls = "successful_calls"
        case failedCalls = "failed_calls"
        case successRate = "success_rate"
    }
    static let empty = LatencyStats(totalCalls: 0, avgLatencyMs: nil, minLatencyMs: nil, maxLatencyMs: nil, successfulCalls: 0, failedCalls: 0, successRate: 0)
    init(totalCalls: Int, avgLatencyMs: Double?, minLatencyMs: Double?, maxLatencyMs: Double?, successfulCalls: Int, failedCalls: Int, successRate: Double) {
        self.totalCalls = totalCalls
        self.avgLatencyMs = avgLatencyMs
        self.minLatencyMs = minLatencyMs
        self.maxLatencyMs = maxLatencyMs
        self.successfulCalls = successfulCalls
        self.failedCalls = failedCalls
        self.successRate = successRate
    }
}

struct ImportPayload: Codable, Sendable {
    let devices: [ImportDevice]
}

struct ImportDevice: Codable, Sendable {
    let deviceId: String
    let deviceName: String
    let deviceType: String
    let hubDeviceId: String?
    let currentTemperature: Double?
    let currentHumidity: Int?
    let battery: Int?
    let lastUpdated: String?
    let readings: [ImportReading]
    enum CodingKeys: String, CodingKey {
        case readings
        case deviceId = "device_id"
        case deviceName = "device_name"
        case deviceType = "device_type"
        case hubDeviceId = "hub_device_id"
        case currentTemperature = "current_temperature"
        case currentHumidity = "current_humidity"
        case battery
        case lastUpdated = "last_updated"
    }

    init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        deviceId = try values.decode(String.self, forKey: .deviceId)
        deviceName = try values.decode(String.self, forKey: .deviceName)
        deviceType = try values.decode(String.self, forKey: .deviceType)
        hubDeviceId = try values.decodeIfPresent(String.self, forKey: .hubDeviceId)
        currentTemperature = try values.decodeIfPresent(Double.self, forKey: .currentTemperature)
        currentHumidity = try values.decodeIfPresent(Int.self, forKey: .currentHumidity)
        battery = try values.decodeIfPresent(Int.self, forKey: .battery)
        lastUpdated = try values.decodeIfPresent(String.self, forKey: .lastUpdated)
        readings = try values.decodeIfPresent([ImportReading].self, forKey: .readings) ?? []
    }
}

struct ImportReading: Codable, Sendable {
    let timestamp: String
    let temperature: Double
    let humidity: Int
    let battery: Int?
}

struct ImportResult: Codable, Sendable {
    let status: String?
    let importedDevices: Int
    let importedReadings: Int
    enum CodingKeys: String, CodingKey {
        case status
        case importedDevices = "imported_devices"
        case importedReadings = "imported_readings"
    }
}

struct BackupFile: Identifiable, Sendable {
    let fileURL: URL
    let filename: String
    var id: URL { fileURL }
}

struct LatencyLogQuery: Sendable {
    var start: Date?
    var end: Date?
    var endpoint: String?
    var deviceId: String?
    var limit: Int = 100
}
