# Temp Master Dashboard

Temp Master monitors temperature, humidity, and battery readings from SwitchBot Meter devices.

## Setup

### Backend

```bash
cd switchbot-dashboard/switchbot-backend
poetry install
cp .env.example .env
poetry run fastapi dev app/main.py
```

The backend reads SwitchBot credentials from `.env`. Its cached data collection interval is
`DATA_COLLECTION_INTERVAL = 3600` seconds.

### Web

```bash
cd switchbot-dashboard/switchbot-frontend
npm ci
npm run dev
```

Open <http://localhost:5173>. The web client polls the backend every 30 seconds.

## API

- `GET /api/meters` returns cached meter readings.
- `GET /api/meters/{device_id}/history?time_scale=hour|day|week|month|year` returns history.
- `GET /api/status` returns backend configuration and rate-limit status.
- `POST /api/meters/refresh` triggers collection (do not call it against the live read-only API during contract checks).

## Clients

- Web: `switchbot-frontend/` (PR [#87](https://github.com/madmerger/temp-master/pull/87), branch `devin/1793609517-react-vite-e2e`)
- Windows: `switchbot-windows/` (PR [#88](https://github.com/madmerger/temp-master/pull/88), branch `devin/1793610149-winui-dashboard`)
- iOS: `switchbot-ios/` (PR [#91](https://github.com/madmerger/temp-master/pull/91), branch `devin/1793614236-swiftui-dashboard`)
- Shared display names: `display_names.json`
- API contract: `contract/api-schema.json`

All clients use the same five time scales (`hour`, `day`, `week`, `month`, `year`), seven-day stale policy,
display-name mapping, and deterministic mock scenario.

## Testing

The client suites arrive in their own pull requests: web [#87](https://github.com/madmerger/temp-master/pull/87),
Windows [#88](https://github.com/madmerger/temp-master/pull/88), and iOS
[#91](https://github.com/madmerger/temp-master/pull/91).

### Backend and contract

Prerequisite: Python 3.12 and Poetry.

```bash
cd switchbot-dashboard/switchbot-backend
poetry install
poetry run pytest
poetry run pytest tests/test_api_contract.py
CONTRACT_API_URL=https://snakeroom.fly.dev poetry run pytest tests/test_api_contract.py -m live_contract
```

The full suite covers backend endpoints, persistence, collection, and API behavior. The contract suite
validates `contract/api-schema.json`, the deterministic fixture, negative cases, and (when opted in) read-only
live GET responses. Pytest output is written to the terminal.

### Web Playwright

Prerequisites: Node.js, npm, and Chromium dependencies.

```bash
cd switchbot-dashboard/switchbot-frontend
npm ci
npx playwright install --with-deps chromium
npm run test:e2e
E2E_API_URL=https://snakeroom.fly.dev npm run test:e2e:smoke
npm test
```

`test:e2e` uses route interception and needs no backend. The smoke suite performs read-only real-API checks;
override `E2E_API_URL` for another endpoint. Playwright HTML output and screenshots are in `playwright-report/`
and `test-results/`.

### Windows UI and Core tests

Prerequisites: Windows 10 1809+, an interactive desktop session, and the .NET 8 SDK.

From `switchbot-dashboard/switchbot-windows/` on Windows:

```powershell
.\run-ui-tests.ps1
dotnet test tests/SwitchBotDashboard.Core.Tests
```

The script builds the WinUI app, runs Core tests, and runs FlaUI UI tests with mock data. Screenshots and test
results are written to `TestResults/`. Core tests also run on Linux and macOS. CI configuration is
`.github/workflows/windows.yml`.

### iOS XCUITest

Prerequisites: macOS with Xcode 15 or newer and an available iPhone simulator.

From `switchbot-dashboard/switchbot-ios/`:

```bash
scripts/run-ui-tests.sh
cd SwitchBotCore
swift test
```

The script runs `SwitchBotCore` tests and the XCUITest scheme. The result bundle is
`TestResults/SwitchBotDashboard.xcresult`; CI configuration is `.github/workflows/ios.yml`.
