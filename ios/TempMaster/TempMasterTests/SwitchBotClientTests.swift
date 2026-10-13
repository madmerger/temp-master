import XCTest
@testable import TempMaster

private struct FixedCredentials: CredentialsProviding {
    func read(account: String) -> String? { account == "token" ? "tok_123" : "sec_456" }
    func save(_ value: String, account: String) throws {}
    func delete(account: String) throws {}
}

private final class MutableTestClock: @unchecked Sendable {
    private let lock = NSLock()
    private var stored: Date
    init(_ date: Date) { stored = date }
    var now: Date {
        lock.lock(); defer { lock.unlock() }
        return stored
    }
    func advance(_ seconds: TimeInterval) {
        lock.lock(); defer { lock.unlock() }
        stored.addTimeInterval(seconds)
    }
}

private final class LatencyCollector: @unchecked Sendable {
    private let lock = NSLock()
    private var values: [LatencyLog] = []
    func append(_ log: LatencyLog) {
        lock.lock(); defer { lock.unlock() }
        values.append(log)
    }
    var logs: [LatencyLog] {
        lock.lock(); defer { lock.unlock() }
        return values
    }
}

final class SwitchBotClientTests: XCTestCase {
    override func tearDown() {
        URLProtocolStub.reset()
        super.tearDown()
    }

    func testSigningMatchesIndependentHMACValue() {
        let headers = SwitchBotClient.signHeaders(
            token: "tok_123",
            secret: "sec_456",
            t: "1700000000000",
            nonce: "123e4567-e89b-12d3-a456-426614174000"
        )
        XCTAssertEqual(headers["sign"], "3nD6luSGfaMd9U2SdpkN00RgAEi98wWaaja8C+pQ850=")
        XCTAssertEqual(headers["Authorization"], "tok_123")
        XCTAssertEqual(headers["Content-Type"], "application/json")
        XCTAssertEqual(headers["charset"], "utf8")
        XCTAssertEqual(headers["t"], "1700000000000")
        XCTAssertEqual(headers["nonce"], "123e4567-e89b-12d3-a456-426614174000")
    }

    func testRateLimitBackoffCapsSkipsCallsAndSuccessResets() async throws {
        let clock = MutableTestClock(Date(timeIntervalSince1970: 1_700_000_000))
        let collector = LatencyCollector()
        URLProtocolStub.handler = { _ in
            URLProtocolStub.requestCount <= 5
                ? (429, [:], Data())
                : (200, [:], Data(#"{"statusCode":100,"body":{"deviceList":[]}}"#.utf8))
        }
        let client = SwitchBotClient(
            session: URLProtocolStub.makeSession(),
            credentials: FixedCredentials(),
            now: { clock.now },
            recordLatency: { collector.append($0) }
        )

        let expected = [120, 240, 480, 600, 600]
        for (index, backoff) in expected.enumerated() {
            do {
                _ = try await client.fetchDevices()
                XCTFail("Expected rate limit")
            } catch SwitchBotClientError.rateLimited {}
            let state = await client.state()
            XCTAssertEqual(state.backoffRemaining, backoff)
            XCTAssertEqual(collector.logs.last?.errorMessage, "Rate limited. Backing off for \(backoff) seconds")
            if index == 0 {
                do {
                    _ = try await client.fetchDevices()
                    XCTFail("Expected call to be blocked")
                } catch SwitchBotClientError.rateLimited {}
                XCTAssertEqual(URLProtocolStub.requestCount, 1)
            }
            clock.advance(TimeInterval(backoff))
        }

        _ = try await client.fetchDevices()
        let state = await client.state()
        XCTAssertFalse(state.isRateLimited)
        XCTAssertEqual(state.backoffRemaining, 0)
        XCTAssertEqual(URLProtocolStub.requestCount, 6)
        XCTAssertEqual(collector.logs.last?.statusCode, 200)
    }

    func testNonSuccessSwitchBotStatusCodeIsRejected() async {
        URLProtocolStub.handler = { _ in
            (200, [:], Data(#"{"statusCode":190,"message":"unauthorized","body":{"deviceList":[]}}"#.utf8))
        }
        let client = SwitchBotClient(
            session: URLProtocolStub.makeSession(),
            credentials: FixedCredentials(),
            recordLatency: { _ in }
        )
        do {
            _ = try await client.fetchDevices()
            XCTFail("Expected API status error")
        } catch SwitchBotClientError.api(let message) {
            XCTAssertEqual(message, "unauthorized")
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
}
