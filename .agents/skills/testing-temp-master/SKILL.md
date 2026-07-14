---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 22+
- SwitchBot API credentials

## Devin Secrets Needed

- `SWITCHBOT_TOKEN` - SwitchBot API token
- `SWITCHBOT_SECRET` - SwitchBot API secret

## Local Development Setup

### 1. Install dependencies

```bash
cd switchbot-dashboard/switchbot-backend && poetry install --no-interaction
cd ../switchbot-frontend && npm ci
```

### 2. Load credentials

Export `SWITCHBOT_TOKEN` and `SWITCHBOT_SECRET` in the shell that starts FastAPI. On a
Devin Linux environment, load the repository-scoped secrets without printing them:

```bash
set -a
source /run/repo_secrets/temp-master/.env.secrets
set +a
```

### 3. Build and link the frontend

Run these commands from the repository root:

```bash
cd switchbot-dashboard/switchbot-frontend && npm run build
cd ../../
ln -sfn "$(pwd)/switchbot-dashboard/switchbot-frontend/dist" switchbot-dashboard/switchbot-backend/static
```

The `static` symlink must target `dist`, not the frontend source directory. The static
directory check in `main.py` happens at import time, so restart FastAPI after creating it.

### 4. Start the integrated server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Built with React + TypeScript + Vite"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected"

### UI Functionality
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Recharts temperature charts update when the time range changes
- Refresh Data button triggers data reload
- Download Backup opens `GET /api/backup`
- Meters without a valid update in the last seven days appear under `未更新のメーター`

### Theme Verification
- Light, Dark, and Aurora themes update the full UI and chart colors
- The selected theme survives a reload through `localStorage`
- With no saved theme, the initial theme follows `prefers-color-scheme`

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Frontend Checks

```bash
cd switchbot-dashboard/switchbot-frontend
npm run lint
npm run build
```

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React + TypeScript + Vite + Recharts
- Production: FastAPI serves the Vite `dist` directory with SPA fallback
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs hourly, with rate limiting and exponential backoff
