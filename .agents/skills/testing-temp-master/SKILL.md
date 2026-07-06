---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 20+ / npm
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

### 2. Create .env file

```bash
cd switchbot-dashboard/switchbot-backend
echo "SWITCHBOT_TOKEN=${SWITCHBOT_TOKEN}" > .env
echo "SWITCHBOT_SECRET=${SWITCHBOT_SECRET}" >> .env
```

### 3. Install frontend dependencies and build

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run build
```

### 4. Symlink frontend build output

The Dockerfile copies `switchbot-frontend/dist/` to `switchbot-backend/static/`, but locally you must create a symlink:

```bash
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink after starting the server, you must restart the server.

### 5. Start the backend server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

### 6. (Optional) Start Vite dev server for live reload

```bash
cd switchbot-dashboard/switchbot-frontend
npm run dev
```

Access `http://localhost:5173/` for hot-reload development. API calls are proxied to the backend on port 8000.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 — Built with React + Recharts"
- Verify no "Snake" or "SnakeRoom" text exists anywhere

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green)

### UI Functionality
- Dark theme is applied by default (dark background, light text)
- Meter cards displayed in a responsive grid
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts line charts rendered in each meter card
- Refresh Data button triggers data reload
- Download Backup button opens `/api/backup`

### Build Verification
- `cd switchbot-dashboard/switchbot-frontend && npm run build` succeeds and generates `dist/`
- `cd switchbot-dashboard/switchbot-frontend && npx tsc --noEmit` passes with no errors

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 19 + TypeScript + Vite + Recharts (dark theme by default)
- Deployment: Fly.io via Docker multi-stage build (see `switchbot-dashboard/Dockerfile`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
