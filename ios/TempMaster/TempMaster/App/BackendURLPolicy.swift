import Foundation

enum BackendURLPolicy {
    static func isAllowed(_ value: String) -> Bool {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let components = URLComponents(string: trimmed),
              let scheme = components.scheme?.lowercased(),
              let host = components.host?.lowercased(),
              components.query == nil,
              components.fragment == nil,
              components.user == nil,
              components.password == nil else {
            return false
        }
        return scheme == "https" || (scheme == "http" && (host == "localhost" || host == "127.0.0.1"))
    }
}
