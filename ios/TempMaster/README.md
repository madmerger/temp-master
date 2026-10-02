# Temp Master (iOS)

iOS port of the SwitchBot temperature dashboard (`switchbot-dashboard/`):
SwiftUI + Swift Charts + on-device SQLite3. No third-party dependencies.
Requirements per `docs/ios-migration/ledger.md` (L-xx/B-xx/V-xx IDs).

## Build

```bash
brew install xcodegen
cd ios/TempMaster
xcodegen generate          # creates TempMaster.xcodeproj (committed)
open TempMaster.xcodeproj
```

Targets: `TempMaster` (app, iOS 17.0, iPhone + iPad),
`TempMasterTests` (hosted unit tests), `TempMasterUITests` (UI tests).
Shared scheme `TempMaster` runs both test targets.

## Test

```bash
./scripts/check_localization.sh

# Verified with the Xcode 27 RC toolchain and an iPhone 17 / iOS 27.0
# simulator. Any installed iOS 17+ simulator works.
export DEVELOPER_DIR=/Applications/Xcode-27.0-RC.app/Contents/Developer
xcodebuild test -project TempMaster.xcodeproj -scheme TempMaster \
  -destination 'platform=iOS Simulator,name=iPhone 17'
```

`scripts/check_localization.sh` enforces key parity across
`Resources/Localization/*.lproj` (Localizable.strings + .stringsdict).

## Run modes

- **Remote** (default): talks to the legacy FastAPI backend; default URL
  `https://snakeroom.fly.dev`, configurable in Settings.
- **Standalone**: the app calls the SwitchBot Cloud API directly and stores
  readings in the on-device SQLite DB (same schema as the legacy backend).
  Credentials live in the Keychain (Settings → SwitchBot Credentials).
  Periodic collection runs every 3600 s while the app is active.

## Launch arguments (tests / debugging)

| Arg | Effect |
|---|---|
| `-UITestMockData` | Use MockMeterService (fixture devices SEED-D1..D6) |
| `-MockRateLimited` | Mock reports is_rate_limited=true, backoff 120 s |
| `-DataSource standalone` | Data source override (UserDefaults arg domain) |
| `-BackendURL http://localhost:8000` | Remote backend URL override |
| `-AppleLanguages "(ja)"` | Run with Japanese localization |

DEBUG only: `-SwitchBotCredentialsFromEnv` copies `SWITCHBOT_TOKEN` /
`SWITCHBOT_SECRET` from the process environment into the Keychain at launch
(values are never logged). Example:

```bash
SIMCTL_CHILD_SWITCHBOT_TOKEN=... SIMCTL_CHILD_SWITCHBOT_SECRET=... \
xcrun simctl launch booted com.madmerger.TempMaster \
  -DataSource standalone -SwitchBotCredentialsFromEnv
```
