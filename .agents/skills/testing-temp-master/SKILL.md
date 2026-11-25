---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Start the Web app

From the repository root, use Node.js 24 and the workspace's pnpm version:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open http://localhost:5173. The Web app uses the production readings API by default. For isolated tests, start the local backend with a test database as described in [the backend setup](../../../switchbot-dashboard/README.md), then run `API_PROXY_TARGET=http://127.0.0.1:8000 VITE_API_URL= corepack pnpm dev` to send readings and backups through Vite's local API proxy. Use test data with a recent meter, a meter at least seven days old, and a meter with no data. For manual refresh, use SwitchBot test credentials or a mocked collection source that supplies a newer reading. Confirm that the meter's last-updated timestamp advances in addition to checking the POST and subsequent reads.

To verify the packaged app, build from the repository root with `docker build -f switchbot-dashboard/Dockerfile -t temp-master .`. FastAPI serves the built Web app at `/` inside the container.

## Web checks

- The page and navbar display “Temp Master Dashboard.” Meter names use the shared aliases.
- Active meters show temperature charts. Stale meters appear in the Japanese warning section and make no history requests.
- The connection indicator and rate-limit banner follow the status API. History updates when the time range changes, and the dashboard polls every 30 seconds.
- Light, Dark, and System control the chart and page colors. The selection survives a reload.
- Refresh triggers a POST followed by reads. The SQLite backup downloads with the filename from `Content-Disposition`.

## Shell checks

From the repository root:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
(cd switchbot-dashboard/switchbot-backend && poetry run pytest)
```
