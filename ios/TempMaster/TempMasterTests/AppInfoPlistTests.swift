import XCTest
@testable import TempMaster

final class AppInfoPlistTests: XCTestCase {
    func testLaunchLocalizationAndScopedATSConfiguration() {
        let info = Bundle.main.infoDictionary ?? [:]
        XCTAssertEqual((info["UILaunchScreen"] as? [String: Any])?.isEmpty, true)
        XCTAssertEqual(info["CFBundleLocalizations"] as? [String], ["en", "ja"])

        let transportSecurity = info["NSAppTransportSecurity"] as? [String: Any]
        XCTAssertFalse(transportSecurity?["NSAllowsArbitraryLoads"] as? Bool ?? false)
        let exceptionDomains = transportSecurity?["NSExceptionDomains"] as? [String: [String: Any]]

        for domain in ["localhost", "127.0.0.1"] {
            let exception = exceptionDomains?[domain]
            XCTAssertEqual(exception?["NSExceptionAllowsInsecureHTTPLoads"] as? Bool, true, domain)
            XCTAssertEqual(exception?["NSIncludesSubdomains"] as? Bool, false, domain)
        }
    }
}
