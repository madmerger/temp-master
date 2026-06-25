---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 22+ / npm (frontend build)
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

### 3. Build the frontend and symlink static files

The frontend is a React + Vite SPA. The Dockerfile builds it and copies the resulting `dist/` to `switchbot-backend/static/`. Locally you must build it and symlink the build output:

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run build   # outputs to switchbot-frontend/dist
cd ../..
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink after starting the server, you must restart the server.

#### Alternative: Vite dev server (hot reload)

For frontend development, run the backend on port 8000 and the Vite dev server separately; it proxies `/api` to the backend:

```bash
cd switchbot-dashboard/switchbot-frontend && npm run dev   # http://localhost:5173
```

### 4. Start the server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Header brand: should say "Temp Master" with a "2.0" badge
- Footer: should say "Temp Master Dashboard v2.0 — React 19 · TypeScript · MUI · Recharts"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status chip in the header shows "接続中 · N台" (green dot)

### UI Functionality
- Responsive card grid (1 / 2 / 3 columns by breakpoint)
- Summary KPI cards: 監視対象 / 平均温度 / 最高温度 / 平均湿度
- Time Range selector (ToggleButtonGroup): 1時間 / 24時間 / 7日 / 30日 / 1年
- Charts: Recharts area charts (SVG), one per meter
- 今すぐ更新 button triggers data reload; バックアップ downloads the DB
- Theme switcher (テーマ menu): 5 themes incl. dark (Midnight / Carbon); selection persists in localStorage (`temp-master-theme`)

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 19 + TypeScript + MUI + Recharts, built with Vite (`switchbot-frontend/`)
- Frontend lint/typecheck: `cd switchbot-frontend && npx tsc --noEmit`
- Deployment: Fly.io (see `fly.toml`); the Dockerfile builds the frontend in a Node stage and serves it from the backend
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
