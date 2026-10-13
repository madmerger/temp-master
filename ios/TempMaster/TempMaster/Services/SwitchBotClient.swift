import CryptoKit
import Foundation

enum SwitchBotClientError: Error {
    case rateLimited
    case api(String)
}

struct SwitchBotCredentials: Sendable {
    let token: String
    let secret: String

    var fingerprint: Data {
        Data(SHA256.hash(data: Data((token + "\n" + secret).utf8)))
    }
}

actor SwitchBotClient {
    static let apiBaseURL = URL(string: "https://api.switch-bot.com/v1.1")!
    static let supportedDeviceTypes: Set<String> = [
        "Meter", "MeterPlus", "WoIOSensor", "Meter Plus (JP)", "Meter Pro", "Meter Pro CO2", "Hub 2", "Hub 3"
    ]

    private let session: URLSession
    private let credentials: CredentialsProviding
    private let now: @Sendable () -> Date
    private let recordLatency: @Sendable (LatencyLog) async -> Void
    private let baseURL: URL
    private var consecutiveErrors = 0
    private var backoffUntil: Date = .distantPast
    private var lastApiCall: TimeInterval = 0

    init(
        session: URLSession = .shared,
        baseURL: URL = SwitchBotClient.apiBaseURL,
        credentials: CredentialsProviding,
        now: @escaping @Sendable () -> Date = Date.init,
        recordLatency: @escaping @Sendable (LatencyLog) async -> Void
    ) {
        self.session = session
        self.baseURL = baseURL
        self.credentials = credentials
        self.now = now
        self.recordLatency = recordLatency
    }

    static func signHeaders(token: String, secret: String, t: String, nonce: String) -> [String: String] {
        let message = Data((token + t + nonce).utf8)
        let key = SymmetricKey(data: Data(secret.utf8))
        let signature = HMAC<SHA256>.authenticationCode(for: message, using: key)
        return [
            "Authorization": token,
            "Content-Type": "application/json",
            "charset": "utf8",
            "t": t,
            "sign": Data(signature).base64EncodedString(),
            "nonce": nonce
        ]
    }

    func fetchDevices(credentialSnapshot: SwitchBotCredentials? = nil) async throws -> [SwitchBotDevice] {
        let data = try await call("/devices", deviceId: nil, credentialSnapshot: credentialSnapshot)
        let response = try JSONDecoder().decode(SwitchBotDevicesEnvelope.self, from: data)
        guard response.statusCode == 100 else { throw SwitchBotClientError.api(response.message ?? "Unknown error") }
        return response.body.deviceList.filter { Self.supportedDeviceTypes.contains($0.deviceType) }
    }

    func fetchStatus(deviceId: String, credentialSnapshot: SwitchBotCredentials? = nil) async throws -> SwitchBotDeviceStatus {
        let pathId = deviceId.addingPercentEncoding(withAllowedCharacters: CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")) ?? deviceId
        let data = try await call("/devices/\(pathId)/status", deviceId: deviceId, credentialSnapshot: credentialSnapshot)
        let response = try JSONDecoder().decode(SwitchBotStatusEnvelope.self, from: data)
        guard response.statusCode == 100 else { throw SwitchBotClientError.api(response.message ?? "Unknown error") }
        return response.body
    }

    func state() -> (isRateLimited: Bool, backoffRemaining: Int, lastApiCall: TimeInterval) {
        let remaining = max(0, Int(backoffUntil.timeIntervalSince(now())))
        return (now() < backoffUntil, remaining, lastApiCall)
    }

    private func call(_ endpoint: String, deviceId: String?, credentialSnapshot: SwitchBotCredentials?) async throws -> Data {
        let start = now()
        guard start >= backoffUntil else { throw SwitchBotClientError.rateLimited }
        let token: String
        let secret: String
        if let credentialSnapshot {
            token = credentialSnapshot.token
            secret = credentialSnapshot.secret
        } else {
            guard let savedToken = credentials.read(account: "token"), !savedToken.isEmpty,
                  let savedSecret = credentials.read(account: "secret"), !savedSecret.isEmpty else {
                throw ServiceError.http(status: 500, requestId: nil, detail: "SwitchBot credentials not configured")
            }
            token = savedToken
            secret = savedSecret
        }
        let milliseconds = String(Int(start.timeIntervalSince1970 * 1000))
        let nonce = UUID().uuidString
        var request = URLRequest(url: URL(string: baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + endpoint)!)
        request.httpMethod = "GET"
        Self.signHeaders(token: token, secret: secret, t: milliseconds, nonce: nonce).forEach {
            request.setValue($0.value, forHTTPHeaderField: $0.key)
        }
        let begin = ProcessInfo.processInfo.systemUptime
        do {
            let (data, response) = try await session.data(for: request)
            let latency = (ProcessInfo.processInfo.systemUptime - begin) * 1000
            let status = (response as? HTTPURLResponse)?.statusCode ?? 500
            lastApiCall = now().timeIntervalSince1970
            if status == 429 {
                consecutiveErrors += 1
                let seconds = min(60 * (1 << min(consecutiveErrors, 20)), 600)
                backoffUntil = now().addingTimeInterval(TimeInterval(seconds))
                await recordLatency(LatencyLog(endpoint: endpoint, deviceId: deviceId, timestamp: now(), latencyMs: latency, statusCode: 429, success: false, errorMessage: "Rate limited. Backing off for \(seconds) seconds"))
                throw SwitchBotClientError.rateLimited
            }
            guard status == 200 else {
                let body = String(data: data, encoding: .utf8) ?? ""
                await recordLatency(LatencyLog(endpoint: endpoint, deviceId: deviceId, timestamp: now(), latencyMs: latency, statusCode: status, success: false, errorMessage: "SwitchBot API error: \(body)"))
                throw SwitchBotClientError.api("SwitchBot API error: \(body)")
            }
            await recordLatency(LatencyLog(endpoint: endpoint, deviceId: deviceId, timestamp: now(), latencyMs: latency, statusCode: 200, success: true))
            consecutiveErrors = 0
            return data
        } catch let error as SwitchBotClientError {
            throw error
        } catch {
            let latency = (ProcessInfo.processInfo.systemUptime - begin) * 1000
            lastApiCall = now().timeIntervalSince1970
            await recordLatency(LatencyLog(endpoint: endpoint, deviceId: deviceId, timestamp: now(), latencyMs: latency, statusCode: 500, success: false, errorMessage: "Request error: \(error.localizedDescription)"))
            throw SwitchBotClientError.api("Request error: \(error.localizedDescription)")
        }
    }
}

struct SwitchBotDevice: Decodable, Sendable {
    let deviceId: String
    let deviceName: String
    let deviceType: String
    let hubDeviceId: String?
    enum CodingKeys: String, CodingKey { case deviceId, deviceName, deviceType, hubDeviceId }
}

struct SwitchBotDeviceStatus: Decodable, Sendable {
    let temperature: Double?
    let humidity: Int?
    let battery: Int?
}

private struct SwitchBotDevicesEnvelope: Decodable {
    let statusCode: Int
    let message: String?
    let body: DeviceList
    struct DeviceList: Decodable { let deviceList: [SwitchBotDevice] }
}

private struct SwitchBotStatusEnvelope: Decodable {
    let statusCode: Int
    let message: String?
    let body: SwitchBotDeviceStatus
}
