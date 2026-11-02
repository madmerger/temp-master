// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SwitchBotCore",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
    ],
    products: [
        .library(name: "SwitchBotCore", targets: ["SwitchBotCore"]),
    ],
    targets: [
        .target(name: "SwitchBotCore"),
        .testTarget(
            name: "SwitchBotCoreTests",
            dependencies: ["SwitchBotCore"],
            path: "Tests",
            resources: [.process("Fixtures")]
        ),
    ]
)
