---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 22+ and npm (frontend build)
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

### 3. Build the frontend and place it under static/

The frontend is now a React + TypeScript + Vite app. It must be built, and the
build output (`dist/`) placed at `switchbot-backend/static/` (the Dockerfile
does this automatically via a Node build stage; locally you do it by hand):

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run build
cd ..
rm -rf switchbot-backend/static
cp -r switchbot-frontend/dist switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create/populate `static/` after starting the server, you must restart the server.

> **Frontend-only iteration:** you can instead run `npm run dev` (http://localhost:5173,
> falling back to 5174 etc. if the port is busy — check the printed URL).
> The dev server proxies `/api` per `vite.config.ts`, and `VITE_API_URL` (default
> `https://snakeroom.fly.dev`) selects the backend the frontend calls.
>
> **Cold-start note:** on first load against a cold backend, the 22 concurrent
> `/api/meters/{id}/history` requests can take **~150s+** before charts render
> ("読み込み中..."). Once warm it's ~0.6s. Wait it out rather than assuming a bug.

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
- Footer: should say "Temp Master Dashboard v1.0 - Built with React + TypeScript + Vite"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge in the navbar: neutral "Connecting…" (grey, pulsing) until the first fetch resolves, then "Connected" (green) when the API is reachable or "Disconnected" (red) on failure

### UI Functionality
- Meter grid (responsive 3-col) plus a separate "未更新のメーター" section for meters stale >7 days
- Dark mode toggle (top-right): switches theme, persists to localStorage, adjusts chart colors
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Chart.js v4 line charts rendered via react-chartjs-2
- Refresh Data button triggers data reload; Download Backup opens `/api/backup`

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS; charts via Chart.js v4 / react-chartjs-2
- Deployment: Fly.io (see `fly.toml`), Docker multi-stage build (Node builds frontend, FastAPI serves `dist/`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
