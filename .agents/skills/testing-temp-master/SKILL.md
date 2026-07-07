---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 22+ / npm
- SwitchBot API credentials

## Devin Secrets Needed

- `SWITCHBOT_TOKEN` - SwitchBot API token
- `SWITCHBOT_SECRET` - SwitchBot API secret

## Local Development Setup

### 1. Install backend dependencies

```bash
cd switchbot-dashboard/switchbot-backend
poetry install --no-interaction
```

### 2. Install frontend dependencies

```bash
cd switchbot-dashboard/switchbot-frontend
npm ci
```

### 3. Create .env file

```bash
cd switchbot-dashboard/switchbot-backend
echo "SWITCHBOT_TOKEN=${SWITCHBOT_TOKEN}" > .env
echo "SWITCHBOT_SECRET=${SWITCHBOT_SECRET}" >> .env
```

### 4. Start the backend

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi dev app/main.py --host 0.0.0.0 --port 8000
```

### 5. Start the Vite dev server (separate terminal)

```bash
cd switchbot-dashboard/switchbot-frontend
npm run dev -- --host 0.0.0.0
```

The frontend dev server runs at `http://localhost:5173` and proxies `/api` requests to the backend on port 8000.

### Alternative: production-style build

```bash
cd switchbot-dashboard/switchbot-frontend
npm run build
```

Then symlink or copy the `dist/` directory to `switchbot-backend/static/` and access the app at `http://localhost:8000/`.

```bash
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import time. If you create the symlink after starting the server, you must restart the server.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 — Built with React + Vite"
- Verify no "Snake" or "SnakeRoom" text exists anywhere

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green)

### UI Functionality
- Default view: 3-column grid of meter panels
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Chart.js line charts rendered with temperature data
- Refresh Data button triggers data reload
- Download Backup button opens backup file

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Running Frontend Typecheck

```bash
cd switchbot-dashboard/switchbot-frontend
npx tsc --noEmit
```

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 19 + TypeScript + Vite + Chart.js v4 + CSS Modules
- Deployment: Fly.io (see `fly.toml`), Dockerfile uses multi-stage build (Node for frontend, Python for backend)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
