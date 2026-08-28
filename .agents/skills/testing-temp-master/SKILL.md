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
