import Foundation
import XCTest
@testable import SwitchBotCore

final class DisplayNameMapTests: XCTestCase {
    func testLoadsSharedDisplayNamesAndPassesUnknownNamesThrough() throws {
        let sharedFile = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .appendingPathComponent("../../../display_names.json")
        let map = try DisplayNameMap(data: Data(contentsOf: sharedFile))

        XCTAssertEqual(map.count, 23)
        XCTAssertEqual(map.resolve("Bedroom Meter"), "第1蒸留塔 (T-101)")
        XCTAssertEqual(map.resolve("Unmapped Meter"), "Unmapped Meter")
    }
}
