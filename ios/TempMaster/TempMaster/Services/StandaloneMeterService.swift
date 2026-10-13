import Foundation

enum CollectionResult: Sendable {
    case completed
    case rateLimited
    case deviceListFailure(String)
}

actor StandaloneMeterService: MeterService {
    private let store: SQLiteStore
    private let credentials: CredentialsProviding
    private let client: SwitchBotClient
    private let now: @Sendable () -> Date
    private var inFlight: Task<CollectionResult, Never>?
    private var inFlightID: UUID?
    private var inFlightFingerprint: Data?

    init(
        store: SQLiteStore,
        credentials: CredentialsProviding = KeychainStore(),
        session: URLSession = .shared,
        now: @escaping @Sendable () -> Date = Date.init,
        switchBotBaseURL: URL = SwitchBotClient.apiBaseURL
    ) {
        self.store = store
        self.credentials = credentials
        self.now = now
        self.client = SwitchBotClient(session: session, baseURL: switchBotBaseURL, credentials: credentials, now: now) { [store] log in
            try? store.insertLatencyLog(log)
        }
    }

    func healthz() async throws -> HealthResponse { HealthResponse(status: "ok") }

    func fetchMeters() async throws -> MetersResponse {
        MetersResponse(meters: try store.allDevices(), lastUpdated: nil)
    }

    func fetchHistory(deviceId: String, timeScale: TimeScale) async throws -> HistoryResponse {
        HistoryResponse(history: try store.readings(deviceId: deviceId, since: now().addingTimeInterval(-timeScale.cutoffSeconds)))
    }

    func refresh() async throws -> RefreshResponse {
        guard hasCredentials else {
            throw ServiceError.http(status: 500, requestId: nil, detail: "SwitchBot credentials not configured")
        }
        if case let .deviceListFailure(message) = await collect() {
            throw ServiceError.transport(message)
        }
        return RefreshResponse(status: "ok", message: "Data collection triggered", metersCount: try? store.allDevices().count)
    }

    func fetchStatus() async throws -> StatusResponse {
        let state = await client.state()
        return StatusResponse(
            configured: hasCredentials,
            metersCount: try store.allDevices().count,
            isRateLimited: state.isRateLimited,
            backoffRemaining: state.backoffRemaining,
            lastApiCall: state.lastApiCall == 0 ? nil : state.lastApiCall,
            collectionInterval: 3600
        )
    }

    func fetchLatencyLogs(_ q: LatencyLogQuery) async throws -> LatencyLogsResponse {
        let logs = try store.latencyLogs(q)
        return LatencyLogsResponse(logs: logs, count: logs.count)
    }

    func fetchLatencyStats(start: Date?, end: Date?) async throws -> LatencyStats {
        try store.latencyStats(start: start, end: end)
    }

    func importData(_ json: Data) async throws -> ImportResult {
        try store.importPayload(json)
    }

    func downloadBackup() async throws -> BackupFile {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyyMMdd_HHmmss"
        let filename = "switchbot_backup_\(formatter.string(from: now())).db"
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let file = folder.appendingPathComponent(filename)
        do {
            try store.backup(to: file)
            return BackupFile(fileURL: file, filename: filename)
        } catch {
            try? FileManager.default.removeItem(at: folder)
            throw error
        }
    }

    @discardableResult
    func collect() async -> CollectionResult {
        while true {
            let currentCredentials = credentialsSnapshot()
            if let inFlight {
                if currentCredentials?.fingerprint == inFlightFingerprint {
                    return await inFlight.value
                }
                let id = inFlightID
                _ = await inFlight.value
                if inFlightID == id {
                    clearInFlight()
                }
                continue
            }
            guard let currentCredentials else { return .completed }
            let id = UUID()
            let fingerprint = currentCredentials.fingerprint
            let task = Task { await collectOnce(using: currentCredentials) }
            inFlight = task
            inFlightID = id
            inFlightFingerprint = fingerprint
            let result = await task.value
            if inFlightID == id {
                clearInFlight()
            }
            return result
        }
    }

    private func clearInFlight() {
        inFlight = nil
        inFlightID = nil
        inFlightFingerprint = nil
    }

    private func collectOnce(using credentials: SwitchBotCredentials) async -> CollectionResult {
        try? store.cleanupOldReadings(now: now())
        try? store.cleanupOldLatencyLogs(now: now())
        let discovered: [SwitchBotDevice]
        do {
            discovered = try await client.fetchDevices(credentialSnapshot: credentials)
        } catch SwitchBotClientError.rateLimited {
            return .rateLimited
        } catch let SwitchBotClientError.api(message) {
            return .deviceListFailure(message)
        } catch {
            return .deviceListFailure(error.localizedDescription)
        }
        do {
            let existing = Dictionary(uniqueKeysWithValues: try store.allDevices().map { ($0.deviceId, $0) })
            for item in discovered {
                var device = existing[item.deviceId] ?? MeterDevice(deviceId: item.deviceId, deviceName: item.deviceName, deviceType: item.deviceType)
                device.deviceName = item.deviceName
                device.deviceType = item.deviceType
                device.hubDeviceId = item.hubDeviceId
                try store.upsertDevice(device)
            }
        } catch {
            return .completed
        }
        guard let allDevices = try? store.allDevices() else { return .completed }
        var wasRateLimited = false
        for device in allDevices {
            do {
                let status = try await client.fetchStatus(deviceId: device.deviceId, credentialSnapshot: credentials)
                guard let temperature = status.temperature else { continue }
                var updated = device
                let timestamp = now()
                updated.currentTemperature = temperature
                updated.currentHumidity = status.humidity
                updated.battery = status.battery
                updated.lastUpdatedRaw = ISO8601Parsing.encode(timestamp)
                try store.upsertDevice(updated)
                try store.insertReading(
                    deviceId: device.deviceId,
                    reading: MeterReading(timestamp: timestamp, temperature: temperature, humidity: status.humidity ?? 0, battery: status.battery)
                )
            } catch SwitchBotClientError.rateLimited {
                wasRateLimited = true
                break
            } catch {
                continue
            }
        }
        return wasRateLimited ? .rateLimited : .completed
    }

    private func credentialsSnapshot() -> SwitchBotCredentials? {
        guard let token = credentials.read(account: "token"), !token.isEmpty,
              let secret = credentials.read(account: "secret"), !secret.isEmpty else { return nil }
        return SwitchBotCredentials(token: token, secret: secret)
    }

    private var hasCredentials: Bool {
        credentialsSnapshot() != nil
    }
}
