import Foundation

/// B-17: mirrors collect_data — no creds -> no-op; fetch devices, upsert
/// names/types keeping current values, then per-device status; temperature
/// present -> update current values + lastUpdated + insert reading
/// (humidity nil -> 0); 429/backoff breaks the loop; errors swallowed.
struct DataCollector: Sendable {
    let client: SwitchBotClient
    let store: SQLiteStore

    func collect() async {
        guard client.credentials() != nil else { return }
        do {
            let devices = try await client.fetchDevices()
            for device in devices {
                var updated = device
                if let existing = store.device(device.deviceID) {
                    updated.currentTemperature = existing.currentTemperature
                    updated.currentHumidity = existing.currentHumidity
                    updated.battery = existing.battery
                    updated.lastUpdated = existing.lastUpdated
                }
                try? store.upsertDevice(updated)
            }

            for existing in store.allDevices() {
                do {
                    let status = try await client.fetchDeviceStatus(existing.deviceID)
                    guard let temperature = Self.double(status["temperature"]) else {
                        continue
                    }
                    let now = client.now()
                    let humidity = Self.int(status["humidity"])
                    var device = existing
                    device.currentTemperature = temperature
                    device.currentHumidity = humidity
                    device.battery = Self.int(status["battery"])
                    device.lastUpdated = now
                    try? store.upsertDevice(device)
                    try? store.insertReading(
                        deviceID: device.deviceID,
                        reading: MeterReading(
                            timestamp: now,
                            temperature: temperature,
                            humidity: humidity ?? 0,
                            battery: device.battery))
                } catch MeterServiceError.http(let code, _) where code == 429 {
                    break
                } catch MeterServiceError.rateLimited {
                    break
                } catch { }
            }
        } catch { }
    }

    private static func double(_ v: Any?) -> Double? {
        switch v {
        case let n as NSNumber: return n.doubleValue
        case let d as Double: return d
        case let i as Int: return Double(i)
        default: return nil
        }
    }

    private static func int(_ v: Any?) -> Int? {
        switch v {
        case let n as NSNumber: return n.intValue
        case let i as Int: return i
        case let d as Double: return Int(d)
        default: return nil
        }
    }
}
