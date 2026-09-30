import Foundation

/// Mirrors the legacy call_switchbot_api / fetch_devices / fetch_device_status.
/// B-09 backoff, B-15 signing, B-16 device filtering.
final class SwitchBotClient: @unchecked Sendable {
    static let baseURL = URL(string: "https://api.switch-bot.com/v1.1")!

    /// B-16 + "Hub 3" (production snakeroom returns Hub 3 meters).
    static let meterDeviceTypes: Set<String> = [
        "Meter", "MeterPlus", "WoIOSensor", "Meter Plus (JP)",
        "Meter Pro", "Meter Pro CO2", "Hub 2", "Hub 3",
    ]

    let credentials: @Sendable () -> (token: String, secret: String)?
    let session: URLSession
    let store: SQLiteStore
    let now: @Sendable () -> Date
    let nonce: @Sendable () -> String

    private let lock = NSLock()
    private var _consecutiveErrors = 0
    private var _backoffUntil: TimeInterval = 0
    private var _lastAPICall: TimeInterval = 0

    var consecutiveErrors: Int { lock.withLock { _consecutiveErrors } }
    var backoffUntil: TimeInterval { lock.withLock { _backoffUntil } }
    var lastAPICall: TimeInterval { lock.withLock { _lastAPICall } }
    var isRateLimited: Bool { now().timeIntervalSince1970 < backoffUntil }
    var backoffRemaining: Int {
        max(0, Int(backoffUntil - now().timeIntervalSince1970))
    }

    init(credentials: @escaping @Sendable () -> (token: String, secret: String)?,
         session: URLSession, store: SQLiteStore,
         now: @escaping @Sendable () -> Date = { Date() },
         nonce: @escaping @Sendable () -> String = { UUID().uuidString }) {
        self.credentials = credentials
        self.session = session
        self.store = store
        self.now = now
        self.nonce = nonce
    }

    /// Mirrors call_switchbot_api. Returns the parsed JSON object.
    func get(endpoint: String, deviceID: String? = nil) async throws -> [String: Any] {
        if isRateLimited {
            throw MeterServiceError.rateLimited(retryAfter: backoffRemaining)
        }
        guard let creds = credentials() else {
            throw MeterServiceError.notConfigured
        }

        let timestampMs = Int64(now().timeIntervalSince1970 * 1000)
        let headers = SwitchBotSigner.headers(
            token: creds.token, secret: creds.secret,
            timestampMs: timestampMs, nonce: nonce())

        var request = URLRequest(url: Self.baseURL.appendingPathComponent(endpoint))
        for (k, v) in headers { request.setValue(v, forHTTPHeaderField: k) }

        let started = ContinuousClock.now
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            let latencyMs = Self.elapsedMs(since: started)
            logLatency(endpoint: endpoint, deviceID: deviceID, latencyMs: latencyMs,
                       statusCode: 500, success: false,
                       errorMessage: "Request error: \(error.localizedDescription)")
            throw MeterServiceError.transport(error.localizedDescription)
        }
        let latencyMs = Self.elapsedMs(since: started)
        lock.withLock { _lastAPICall = now().timeIntervalSince1970 }

        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? -1
        let bodyText = String(data: data, encoding: .utf8) ?? ""

        if statusCode == 429 {
            let errors = lock.withLock {
                _consecutiveErrors += 1
                return _consecutiveErrors
            }
            let backoff = BackoffPolicy.delay(consecutiveErrors: errors)
            lock.withLock { _backoffUntil = now().timeIntervalSince1970 + TimeInterval(backoff) }
            logLatency(endpoint: endpoint, deviceID: deviceID, latencyMs: latencyMs,
                       statusCode: 429, success: false,
                       errorMessage: "Rate limited. Backing off for \(backoff) seconds")
            throw MeterServiceError.http(
                status: 429,
                detail: "Rate limited by SwitchBot API. Backing off for \(backoff) seconds")
        }

        if statusCode != 200 {
            logLatency(endpoint: endpoint, deviceID: deviceID, latencyMs: latencyMs,
                       statusCode: statusCode, success: false,
                       errorMessage: "SwitchBot API error: \(bodyText)")
            throw MeterServiceError.http(
                status: statusCode, detail: "SwitchBot API error: \(bodyText)")
        }

        logLatency(endpoint: endpoint, deviceID: deviceID, latencyMs: latencyMs,
                   statusCode: 200, success: true, errorMessage: nil)
        lock.withLock { _consecutiveErrors = 0 }

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw MeterServiceError.invalidResponse
        }
        return json
    }

    private static func elapsedMs(since start: ContinuousClock.Instant) -> Double {
        let c = (ContinuousClock.now - start).components
        return Double(c.seconds) * 1000 + Double(c.attoseconds) / 1e15
    }

    private func logLatency(endpoint: String, deviceID: String?, latencyMs: Double,
                            statusCode: Int, success: Bool, errorMessage: String?) {
        try? store.insertLatencyLog(
            endpoint: endpoint, deviceID: deviceID, timestamp: now(),
            latencyMs: latencyMs, statusCode: statusCode,
            success: success, errorMessage: errorMessage)
    }

    /// B-16: fetch /devices and filter to meter device types.
    func fetchDevices() async throws -> [MeterDevice] {
        let json = try await get(endpoint: "/devices")
        guard (json["statusCode"] as? Int) == 100 else {
            throw MeterServiceError.http(
                status: 500,
                detail: "SwitchBot API returned error: \(json["message"] as? String ?? "Unknown error")")
        }
        let list = ((json["body"] as? [String: Any])?["deviceList"] as? [[String: Any]]) ?? []
        return list.compactMap { device in
            let type = device["deviceType"] as? String ?? ""
            guard Self.meterDeviceTypes.contains(type) else { return nil }
            return MeterDevice(
                deviceID: device["deviceId"] as? String ?? "",
                deviceName: device["deviceName"] as? String ?? "Unknown",
                deviceType: type,
                hubDeviceID: device["hubDeviceId"] as? String)
        }
    }

    func fetchDeviceStatus(_ deviceID: String) async throws -> [String: Any] {
        let json = try await get(endpoint: "/devices/\(deviceID)/status", deviceID: deviceID)
        guard (json["statusCode"] as? Int) == 100 else {
            throw MeterServiceError.http(
                status: 500,
                detail: "SwitchBot API returned error: \(json["message"] as? String ?? "Unknown error")")
        }
        return (json["body"] as? [String: Any]) ?? [:]
    }
}

private extension NSLock {
    func withLock<T>(_ body: () -> T) -> T {
        lock(); defer { unlock() }
        return body()
    }
}
