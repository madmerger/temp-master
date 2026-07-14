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

### 3. Build the frontend into the backend's static directory

The frontend is a Vite + React + TypeScript app. The Dockerfile builds it and
copies `switchbot-frontend/dist/` to `switchbot-backend/static/`. To reproduce
locally, build the SPA and symlink (or copy) `dist/` to `static/`:

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run build
ln -s $(pwd)/dist ../switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink after starting the server, you must restart the server.

### 4. Start the server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

### Frontend-only iteration (Vite dev server)

For frontend-only changes, run the Vite dev server instead — it proxies `/api`
to the backend (see `vite.config.ts`):

```bash
cd switchbot-dashboard/switchbot-frontend
npm run dev -- --host 0.0.0.0   # http://localhost:5173
```

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + Vite"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green pill)

### UI Functionality
- Theme toggle (sun/moon in the navbar): switches light/dark, persists across reloads, and chart colors follow the theme
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts SVG line charts (one per active meter)
- Stale meters (7+ days without update) appear in the "未更新のメーター" section without charts
- Refresh Data button triggers data reload; Download Backup opens `/api/backup`

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: Vite + React + TypeScript + Recharts (built to `dist/`, served from backend `static/`)
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
