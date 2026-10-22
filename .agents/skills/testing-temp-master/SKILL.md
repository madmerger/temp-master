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

### 3. Build the frontend and symlink the build output

The frontend is a Vite + React + TypeScript app. The Dockerfile builds it in a Node stage and copies `switchbot-frontend/dist/` to `./static/`. Locally, build it and symlink `dist/` (never commit the symlink; remove it before running pytest):

```bash
cd switchbot-dashboard/switchbot-frontend && npm ci && VITE_API_URL= npm run build && cd -
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

Alternatively, run `npm run dev` in `switchbot-frontend/` (http://localhost:5173, `/api` is proxied to localhost:8000).

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink after starting the server, you must restart the server.

### 4. Start the server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + TypeScript + Vite"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green, `data-variant="success"`)

### UI Functionality
- Meter grid: 3 columns (>=992px), 2 columns (>=768px), 1 column otherwise; stale meters (7+ days) in 「未更新のメーター」
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts `LineChart` (SVG) per active meter (`data-testid="chart-<device_id>"`)
- Refresh Data button triggers data reload

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 18 + TypeScript + Vite + Recharts (`switchbot-frontend/src/`); unit tests via `npm test`, checks via `npm run typecheck && npm run lint`
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
