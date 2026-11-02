import Foundation

public struct DisplayNameMap: Sendable {
    private let names: [String: String]

    public init(data: Data) throws {
        names = try JSONDecoder().decode([String: String].self, from: data)
    }

    public init(names: [String: String]) {
        self.names = names
    }

    public var count: Int { names.count }

    public func resolve(_ name: String) -> String {
        names[name] ?? name
    }
}
