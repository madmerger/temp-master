---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 22+ / npm (frontend)
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

### 3. Start the backend

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The API docs are at `http://localhost:8000/docs`.

### 4. Start the frontend dev server

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run dev
```

The dashboard is served at `http://localhost:5173/` and `/api` is proxied to `http://localhost:8000`.

To test the production layout instead, build the frontend and symlink `dist/` as the backend's static dir
(the check in `main.py` happens at import time, so create the symlink before starting the server):

```bash
cd switchbot-dashboard/switchbot-frontend && npm run build
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

### Testing frontend-only changes against a production backend

Local SwitchBot rate limits often leave the local backend without meter data, so point the dev proxy at a
production backend instead. Check which one has data before starting:

```bash
curl -s https://temp-master.fly.dev/api/status
curl -s 'https://temp-master.fly.dev/api/meters/<device_id>/history?time_scale=day'
```

If the history is empty, use `https://snakeroom.fly.dev` instead. Note `snakeroom.fly.dev` returns HTTP 401
for `/api/backup`, so backup downloads cannot be verified there.

The proxy change in `vite.config.ts` is test-only: always restore `target: 'http://localhost:8000'` (and drop
any `secure: false`) and confirm `git status` is clean before committing.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + TypeScript + Vite + Tailwind CSS"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green)

### UI Functionality
- Dark mode toggle: switches theme, persists in `localStorage` (`temp-master-theme`) across reloads
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Canvas elements rendered with Chart.js v4 line charts
- Refresh Data button triggers data reload
- Stale meters (no update for 7+ days) appear in the "未更新のメーター" section

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React + TypeScript + Vite + Tailwind CSS + Chart.js v4 (`switchbot-frontend/src`)
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with a 3600s interval, with rate limiting and exponential backoff
