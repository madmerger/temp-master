# Temp Master Dashboard for iOS

The SwiftUI app targets iOS 16 and uses the shared `SwitchBotCore` package.

```sh
cd switchbot-dashboard/switchbot-ios
swift test --package-path SwitchBotCore
xcodebuild -project SwitchBotDashboard.xcodeproj -scheme SwitchBotDashboard \
  -destination 'platform=iOS Simulator,name=iPhone 17' test
```

Run the full simulator workflow, including core tests and an `.xcresult` bundle, with `scripts/run-ui-tests.sh` on macOS with Xcode installed. Linux supports the `SwitchBotCore` build and tests only.

For deterministic UI testing, launch with `-UITestMockData`. Use `-APIBaseURL <url>` to override the default API endpoint.
