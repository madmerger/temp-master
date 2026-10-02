import Foundation

enum TimeScale: String, Codable, CaseIterable, Identifiable {
    case hour, day, week, month, year

    var id: String { rawValue }

    /// B-04: history window seconds.
    var window: TimeInterval {
        switch self {
        case .hour: return 3600
        case .day: return 86400
        case .week: return 604800
        case .month: return 2592000
        case .year: return 31536000
        }
    }

    var labelKey: String {
        switch self {
        case .hour: return "timerange.last_hour"
        case .day: return "timerange.last_24_hours"
        case .week: return "timerange.last_7_days"
        case .month: return "timerange.last_30_days"
        case .year: return "timerange.last_year"
        }
    }
}

struct MeterDevice: Codable, Identifiable, Hashable {
    var deviceID: String
    var deviceName: String
    var deviceType: String
    var hubDeviceID: String?
    var currentTemperature: Double?
    var currentHumidity: Int?
    var battery: Int?
    var lastUpdated: Date?

    var id: String { deviceID }

    enum CodingKeys: String, CodingKey {
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

struct MeterReading: Codable, Hashable {
    var timestamp: Date
    var temperature: Double
    var humidity: Int
    var battery: Int?
}

struct MetersResponse: Codable {
    var meters: [MeterDevice]
    var lastUpdated: Date?

    enum CodingKeys: String, CodingKey {
        case meters
        case lastUpdated = "last_updated"
    }
}

struct HistoryResponse: Codable {
    var deviceID: String
    var timeScale: TimeScale
    var history: [MeterReading]
    var device: MeterDevice?

    enum CodingKeys: String, CodingKey {
        case deviceID = "device_id"
        case timeScale = "time_scale"
        case history, device
    }
}

struct RefreshResponse: Codable {
    var status: String
    var message: String
    var metersCount: Int

    enum CodingKeys: String, CodingKey {
        case status, message
        case metersCount = "meters_count"
    }
}

/// B-14. Unknown keys (e.g. `user_configured` on prod) are ignored by Codable.
struct ServiceStatus: Codable {
    var configured: Bool
    var metersCount: Int
    var isRateLimited: Bool
    var backoffRemaining: Int
    var lastApiCall: Double
    var collectionInterval: Int

    enum CodingKeys: String, CodingKey {
        case configured
        case metersCount = "meters_count"
        case isRateLimited = "is_rate_limited"
        case backoffRemaining = "backoff_remaining"
        case lastApiCall = "last_api_call"
        case collectionInterval = "collection_interval"
    }
}

struct LatencyLog: Codable, Identifiable, Hashable {
    var id: Int?
    var endpoint: String
    var deviceID: String?
    var timestamp: Date
    var latencyMs: Double
    var statusCode: Int
    var success: Bool
    var errorMessage: String?

    enum CodingKeys: String, CodingKey {
        case id, endpoint
        case deviceID = "device_id"
        case timestamp
        case latencyMs = "latency_ms"
        case statusCode = "status_code"
        case success
        case errorMessage = "error_message"
    }
}

struct LatencyStats: Codable {
    var totalCalls: Int
    var avgLatencyMs: Double?
    var minLatencyMs: Double?
    var maxLatencyMs: Double?
    var successfulCalls: Int
    var failedCalls: Int
    var successRate: Double

    enum CodingKeys: String, CodingKey {
        case totalCalls = "total_calls"
        case avgLatencyMs = "avg_latency_ms"
        case minLatencyMs = "min_latency_ms"
        case maxLatencyMs = "max_latency_ms"
        case successfulCalls = "successful_calls"
        case failedCalls = "failed_calls"
        case successRate = "success_rate"
    }
}

struct LatencyLogFilter {
    var start: Date? = nil
    var end: Date? = nil
    var endpoint: String? = nil
    var deviceID: String? = nil
    var limit: Int = 100
}

struct ImportReadingData: Codable {
    var timestamp: String
    var temperature: Double
    var humidity: Int
    var battery: Int? = nil
}

struct ImportDeviceData: Codable {
    var deviceID: String
    var deviceName: String
    var deviceType: String
    var hubDeviceID: String?
    var currentTemperature: Double?
    var currentHumidity: Int?
    var battery: Int?
    var lastUpdated: String?
    var readings: [ImportReadingData] = []

    enum CodingKeys: String, CodingKey {
        case deviceID = "device_id"
        case deviceName = "device_name"
        case deviceType = "device_type"
        case hubDeviceID = "hub_device_id"
        case currentTemperature = "current_temperature"
        case currentHumidity = "current_humidity"
        case battery
        case lastUpdated = "last_updated"
        case readings
    }
}

struct ImportData: Codable {
    var devices: [ImportDeviceData]
}

struct ImportResult: Codable {
    var status: String
    var importedDevices: Int
    var importedReadings: Int

    enum CodingKeys: String, CodingKey {
        case status
        case importedDevices = "imported_devices"
        case importedReadings = "imported_readings"
    }
}
