import XCTest
@testable import TempMaster

final class LocalMeterServiceTests: XCTestCase {
    private func makeService(creds: Bool = false) throws -> (LocalMeterService, SQLiteStore) {
        let store = try tempStore()
        let client = SwitchBotClient(
            credentials: { creds ? ("t", "s") : nil },
            session: StubURLProtocol.session(),
            store: store)
        return (LocalMeterService(store: store, client: client), store)
    }

    override func tearDown() { StubURLProtocol.handler = nil }

    func testHistory404ForUnknownDevice() async throws {
        let (svc, _) = try makeService()
        do {
            _ = try await svc.fetchHistory(deviceID: "nope", timeScale: .day)
            XCTFail("expected 404")
        } catch MeterServiceError.http(let status, let detail) {
            XCTAssertEqual(status, 404)
            XCTAssertEqual(detail, "Device not found")
        }
    }

    func testRefreshWithoutCredsIsNotConfigured() async throws {
        let (svc, _) = try makeService(creds: false)
        do {
            _ = try await svc.refresh()
            XCTFail("expected throw")
        } catch {
            XCTAssertEqual(error as? MeterServiceError, .notConfigured)
        }
    }

    func testStatusFields() async throws {
        let (svc, store) = try makeService(creds: false)
        try store.upsertDevice(MeterDevice(deviceID: "D1", deviceName: "n",
                                           deviceType: "Meter"))
        let status = try await svc.fetchStatus()
        XCTAssertFalse(status.configured)
        XCTAssertEqual(status.metersCount, 1)
        XCTAssertFalse(status.isRateLimited)
        XCTAssertEqual(status.backoffRemaining, 0)
        XCTAssertEqual(status.collectionInterval, 3600)
    }

    func testFetchMetersLastUpdatedMax() async throws {
        let (svc, store) = try makeService()
        let now = Date()
        try store.upsertDevice(MeterDevice(
            deviceID: "D1", deviceName: "n", deviceType: "Meter",
            lastUpdated: now.addingTimeInterval(-100)))
        try store.upsertDevice(MeterDevice(
            deviceID: "D2", deviceName: "n", deviceType: "Meter",
            lastUpdated: now))
        let resp = try await svc.fetchMeters()
        XCTAssertEqual(resp.lastUpdated!.timeIntervalSince1970,
                       now.timeIntervalSince1970, accuracy: 0.001)
    }
}
