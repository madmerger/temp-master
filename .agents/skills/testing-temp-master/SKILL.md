---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Node 20+
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

### 3. Build the frontend and symlink dist

The Dockerfile builds the frontend and copies `dist/` to `switchbot-backend/static/`, but locally this directory doesn't exist. Build the frontend and create a symlink to its `dist` output:

```bash
cd switchbot-dashboard/switchbot-frontend
npm ci && npm run build
cd ../..
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

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
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + Vite"
- Verify the internal backend codename does not appear in the UI: `document.body.innerHTML` should contain no occurrence of it (check via a case-insensitive search for the old service name)

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green badge)

### UI Functionality
- Layout: Default 3-col grid + '未更新のメーター' section for meters stale ≥7 days
- Theme toggle button switches between light and dark mode (persisted to localStorage)
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Canvas elements rendered with Chart.js v4 line charts (canvas)
- Refresh Data button triggers data reload

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Frontend checks

```bash
cd switchbot-dashboard/switchbot-frontend
npm run typecheck
npm run build
```

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS + Chart.js v4 (`switchbot-frontend/`)
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 3600s interval, with rate limiting and exponential backoff
