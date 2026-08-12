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

### Backend

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

### Frontend

The frontend is a Vite + React application. Install dependencies and start Vite on port 5173:

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run dev -- --host 0.0.0.0
```

The frontend reads `VITE_API_URL` from `.env`; when unset, it defaults to `https://snakeroom.fly.dev`. The production Docker image serves the Vite `dist/` output from FastAPI's `static/` directory.

### Optional local backend

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

For frontend-only verification, use the production backend rather than the local backend because SwitchBot API rate limiting can leave local data empty. Set `VITE_API_URL=https://snakeroom.fly.dev` (the default) and use `http://localhost:5173`.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v1.0"

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status indicator shows "Connected"
- `GET https://snakeroom.fly.dev/api/backup` currently returns `401`; `https://temp-master.fly.dev/api/backup` returns `200`

### UI Functionality
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts temperature line charts
- Refresh Data button triggers data reload
- Header theme toggle switches and persists light/dark mode

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: jQuery + Bootstrap 3 (single `index.html` file)
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
