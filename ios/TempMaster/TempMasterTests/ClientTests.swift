import XCTest
@testable import TempMaster

final class SwitchBotClientTests: XCTestCase {
    private func makeClient(
        creds: Bool = true,
        handler: @escaping (URLRequest) throws -> (HTTPURLResponse, Data)
    ) throws -> (SwitchBotClient, SQLiteStore) {
        let store = try tempStore()
        StubURLProtocol.handler = handler
        let client = SwitchBotClient(
            credentials: { creds ? ("token", "secret") : nil },
            session: StubURLProtocol.session(),
            store: store)
        return (client, store)
    }

    override func tearDown() { StubURLProtocol.handler = nil }

    func testMissingCredsThrowsNotConfigured() async throws {
        let (client, _) = try makeClient(creds: false) { _ in
            XCTFail("network must not be hit")
            return (StubURLProtocol.response(url: URL(string: "https://x")!), Data())
        }
        do {
            _ = try await client.get(endpoint: "/devices")
            XCTFail("expected throw")
        } catch {
            XCTAssertEqual(error as? MeterServiceError, .notConfigured)
        }
    }

    func testDeviceTypeFilteringIncludesHub3() async throws {
        // Hub 3 is collected (production snakeroom returns Hub 3 meters);
        // Bot is not.
        let (client, _) = try makeClient { _ in
            (StubURLProtocol.response(url: URL(string: "https://x")!),
             StubURLProtocol.json([
                "statusCode": 100,
                "body": ["deviceList": [
                    ["deviceId": "m1", "deviceName": "a", "deviceType": "Meter"],
                    ["deviceId": "h3", "deviceName": "hub", "deviceType": "Hub 3"],
                    ["deviceId": "bot", "deviceName": "b", "deviceType": "Bot"],
                    ["deviceId": "mp", "deviceName": "c", "deviceType": "Meter Pro CO2"],
                ]]]))
        }
        let devices = try await client.fetchDevices()
        XCTAssertEqual(devices.map(\.deviceID), ["m1", "h3", "mp"])
    }

    func testStatusCodeNot100Throws() async throws {
        let (client, _) = try makeClient { _ in
            (StubURLProtocol.response(url: URL(string: "https://x")!),
             StubURLProtocol.json(["statusCode": 190, "message": "wrong"]))
        }
        do {
            _ = try await client.fetchDevices()
            XCTFail("expected throw")
        } catch MeterServiceError.http(let status, _) {
            XCTAssertEqual(status, 500)
        } catch {
            XCTFail("got \(error)")
        }
    }

    func test429BacksOffAndSkipsNetwork() async throws {
        var calls = 0
        var current = Date()
        let store = try tempStore()
        StubURLProtocol.handler = { _ in
            calls += 1
            return (StubURLProtocol.response(url: URL(string: "https://x")!, status: 429),
                    Data())
        }
        let client = SwitchBotClient(
            credentials: { ("t", "s") },
            session: StubURLProtocol.session(),
            store: store,
            now: { current })
        do {
            _ = try await client.get(endpoint: "/devices")
            XCTFail("expected throw")
        } catch MeterServiceError.http(let status, _) {
            XCTAssertEqual(status, 429)
        } catch {
            XCTFail("got \(error)")
        }
        XCTAssertTrue(client.isRateLimited)
        XCTAssertEqual(client.backoffRemaining, 120)
        // Call during backoff -> rateLimited without hitting the network.
        do {
            _ = try await client.get(endpoint: "/devices")
            XCTFail("expected throw")
        } catch {
            XCTAssertEqual(error as? MeterServiceError, .rateLimited(retryAfter: 120))
        }
        XCTAssertEqual(calls, 1)
        let logs = store.latencyLogs(LatencyLogFilter())
        XCTAssertEqual(logs.count, 1)
        XCTAssertEqual(logs[0].errorMessage, "Rate limited. Backing off for 120 seconds")
    }

    func testNon200LogsError() async throws {
        let (client, store) = try makeClient { req in
            (StubURLProtocol.response(url: req.url!, status: 500), Data("oops".utf8))
        }
        do {
            _ = try await client.get(endpoint: "/x")
            XCTFail("expected throw")
        } catch { }
        let logs = store.latencyLogs(LatencyLogFilter())
        XCTAssertEqual(logs[0].errorMessage, "SwitchBot API error: oops")
    }

    func testSuccessResetsConsecutiveErrors() async throws {
        var current = Date()
        var returns429 = true
        let store = try tempStore()
        StubURLProtocol.handler = { req in
            if returns429 {
                return (StubURLProtocol.response(url: req.url!, status: 429), Data())
            }
            return (StubURLProtocol.response(url: req.url!),
                    StubURLProtocol.json(["statusCode": 100, "body": [:]]))
        }
        let client = SwitchBotClient(
            credentials: { ("t", "s") },
            session: StubURLProtocol.session(),
            store: store,
            now: { current })
        do {
            _ = try await client.get(endpoint: "/x")
            XCTFail("expected throw")
        } catch { }
        XCTAssertEqual(client.consecutiveErrors, 1)
        returns429 = false
        current = current.addingTimeInterval(120) // backoff expired
        _ = try await client.get(endpoint: "/x")
        XCTAssertEqual(client.consecutiveErrors, 0)
    }
}

final class DataCollectorTests: XCTestCase {
    override func tearDown() { StubURLProtocol.handler = nil }

    private func deviceList(_ types: [(String, String)]) -> Any {
        ["statusCode": 100, "body": ["deviceList": types.map {
            ["deviceId": $0.0, "deviceName": "n\($0.0)", "deviceType": $0.1]
        }]]
    }

    func testCollectNoCredsIsNoop() async throws {
        let store = try tempStore()
        StubURLProtocol.handler = { _ in
            XCTFail("network must not be hit")
            return (StubURLProtocol.response(url: URL(string: "https://x")!), Data())
        }
        let client = SwitchBotClient(credentials: { nil },
                                     session: StubURLProtocol.session(),
                                     store: store)
        await DataCollector(client: client, store: store).collect()
        XCTAssertEqual(store.allDevices().count, 0)
    }

    func testCollectSavesStatusAndReading() async throws {
        let store = try tempStore()
        StubURLProtocol.handler = { req in
            if req.url!.path.hasSuffix("/devices") {
                return (StubURLProtocol.response(url: req.url!),
                        StubURLProtocol.json(self.deviceList([("m1", "Meter")])))
            }
            return (StubURLProtocol.response(url: req.url!),
                    StubURLProtocol.json([
                        "statusCode": 100,
                        "body": ["temperature": 21.5, "humidity": 60, "battery": 88]]))
        }
        let client = SwitchBotClient(credentials: { ("t", "s") },
                                     session: StubURLProtocol.session(),
                                     store: store)
        await DataCollector(client: client, store: store).collect()
        let d = store.device("m1")
        XCTAssertEqual(d?.currentTemperature, 21.5)
        XCTAssertEqual(d?.battery, 88)
        XCTAssertNotNil(d?.lastUpdated)
        XCTAssertEqual(store.readings(deviceID: "m1", since: .distantPast).count, 1)
    }

    func testHumidityNilBecomesZeroInReading() async throws {
        let store = try tempStore()
        StubURLProtocol.handler = { req in
            if req.url!.path.hasSuffix("/devices") {
                return (StubURLProtocol.response(url: req.url!),
                        StubURLProtocol.json(self.deviceList([("m1", "Meter")])))
            }
            return (StubURLProtocol.response(url: req.url!),
                    StubURLProtocol.json([
                        "statusCode": 100,
                        "body": ["temperature": 21.5, "battery": 88]]))
        }
        let client = SwitchBotClient(credentials: { ("t", "s") },
                                     session: StubURLProtocol.session(),
                                     store: store)
        await DataCollector(client: client, store: store).collect()
        XCTAssertNil(store.device("m1")?.currentHumidity)
        XCTAssertEqual(store.readings(deviceID: "m1", since: .distantPast)[0].humidity, 0)
    }

    func testNoTemperatureNoReading() async throws {
        let store = try tempStore()
        StubURLProtocol.handler = { req in
            if req.url!.path.hasSuffix("/devices") {
                return (StubURLProtocol.response(url: req.url!),
                        StubURLProtocol.json(self.deviceList([("m1", "Meter")])))
            }
            return (StubURLProtocol.response(url: req.url!),
                    StubURLProtocol.json(["statusCode": 100, "body": ["humidity": 60]]))
        }
        let client = SwitchBotClient(credentials: { ("t", "s") },
                                     session: StubURLProtocol.session(),
                                     store: store)
        await DataCollector(client: client, store: store).collect()
        XCTAssertNil(store.device("m1")?.currentTemperature)
        XCTAssertEqual(store.readings(deviceID: "m1", since: .distantPast).count, 0)
    }

    func test429BreaksDeviceLoop() async throws {
        let store = try tempStore()
        var statusCalls = 0
        StubURLProtocol.handler = { req in
            if req.url!.path.hasSuffix("/devices") {
                return (StubURLProtocol.response(url: req.url!),
                        StubURLProtocol.json(self.deviceList(
                            [("m1", "Meter"), ("m2", "Meter")])))
            }
            statusCalls += 1
            return (StubURLProtocol.response(url: req.url!, status: 429), Data())
        }
        let client = SwitchBotClient(credentials: { ("t", "s") },
                                     session: StubURLProtocol.session(),
                                     store: store)
        await DataCollector(client: client, store: store).collect()
        XCTAssertEqual(statusCalls, 1) // loop broke on first 429
    }
}

