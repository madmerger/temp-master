---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- SwitchBot API credentials

## Devin Secrets Needed

- `SWITCHBOT_TOKEN` - SwitchBot API token
- `SWITCHBOT_SECRET` - SwitchBot API secret

## Local Development Setup

### 1. Install dependencies

```bash
cd switchbot-dashboard/switchbot-backend
poetry install --no-interaction
```

### 2. Create .env file

```bash
cd switchbot-dashboard/switchbot-backend
echo "SWITCHBOT_TOKEN=${SWITCHBOT_TOKEN}" > .env
echo "SWITCHBOT_SECRET=${SWITCHBOT_SECRET}" >> .env
```

### 3. Build the frontend

The React app must be built before it can be served; the build output goes to `switchbot-frontend/dist`:

```bash
cd switchbot-dashboard/switchbot-frontend
npm ci
npm run build
```

### 4. Symlink frontend static files

The Dockerfile copies the built `switchbot-frontend/dist` to `switchbot-backend/static/`, but locally this directory doesn't exist. From the repository root, create a symlink:

```bash
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink after starting the server, you must restart the server.

### 5. Start the server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

## Frontend-only changes: getting real meter data into the UI

A local backend usually has NO meter data (SwitchBot API rate limits), so charts render empty.
Two options, in order of preference:

### Option A: proxy the Vite dev server at production (read-only checks)

Temporarily set the `/api` proxy target in `switchbot-frontend/vite.config.ts` to
`https://temp-master.fly.dev` (add `secure: true`), then:

```bash
cd switchbot-dashboard/switchbot-frontend && npm ci && npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`. Leave `VITE_API_URL` unset (the app reads
`import.meta.env.VITE_API_URL ?? ''`) so the proxy is used; do not create a `.env`.
**Always revert `vite.config.ts` to `http://localhost:8000` and never commit that edit.**

Caveat: production's cached readings may all be older than the 7-day stale threshold
(`STALE_METER_THRESHOLD_MS` in `src/lib/constants.ts`). If so, every meter lands in the
"未更新のメーター" section and NO charts render, which blocks chart/tooltip testing.

### Option B: time-shifted copy of the production DB (needed for chart testing)

Download the production backup and shift timestamps forward so data looks current:

```bash
curl -s https://temp-master.fly.dev/api/backup -o /tmp/prod.db
# shift readings.timestamp and devices.last_updated so the newest dense data is ~now
# leave one device untouched to keep exercising the stale-meter section
DB_PATH=/tmp/prod.db poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

Point the Vite proxy at `http://localhost:8000` (the committed default) and reload.
Verify each scale actually has rows before testing: `hour` and `day` need data within the
last 1h/24h, otherwise those charts are empty even though `week`/`month` look fine.

## Known performance trap: month/year scales

Selecting "Last 30 Days" or especially "Last Year" makes ~18 Recharts charts render
thousands of points each (year ≈ 24k rows per meter). The browser can become
**unresponsive for several minutes** and computer-use actions may time out. This is not
necessarily a functional bug — wait and retry `view` rather than concluding failure, and
reload the page to return to the lighter default "Last 24 Hours". Worth flagging to the
user as a UX/perf concern.

## Theme toggle checks (light/dark)

- localStorage key is `theme` with values `light` / `dark`; `ThemeProvider` toggles the
  `dark` class on `document.documentElement`.
- `index.html` has an inline `<head>` script that applies the `dark` class before React
  mounts (prevents a light flash on reload) — verify no flash after reloading in dark mode.
- Recharts colors are theme-dependent in `src/components/TemperatureChart.tsx`. Useful
  assertions: grid stroke `#e2e8f0` (light) vs `#475569` (dark), axis tick fill `#64748b`
  vs `#cbd5e1`, tooltip bg `#ffffff` vs `#1e293b`.
- Always hover a chart point in BOTH modes and screenshot the tooltip; contrast bugs
  (white-on-white / dark-on-dark) only show up visually.

## Status bar "Last refresh"

Comes from a `lastRefresh` state set only on a successful fetch (`src/App.tsx`), and the
span is hidden until the first success. It must NOT change when only the theme or the time
range changes; it should advance on the 30s auto-refresh and after "Refresh Data".
Sample the value immediately before and after the action — the 30s timer can otherwise be
mistaken for a re-render bug.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + Vite"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`
- Theme toggle: navbar button has an accessible `aria-label` and visibly switches light/dark colors

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge in the navbar shows "Connected" (green Tailwind badge, `bg-emerald-100 text-emerald-800`; `dark:bg-emerald-900/60 dark:text-emerald-200` in dark mode)

### UI Functionality
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts line charts render temperature history
- Refresh Data button triggers data reload

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React + Vite + TypeScript + Tailwind CSS + Recharts
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with a one-hour interval, with rate limiting and exponential backoff
