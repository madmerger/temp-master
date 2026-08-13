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

### 3. Start the backend server (optional)

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The API is served at `http://localhost:8000/docs`. The local backend may not have
meter data because of SwitchBot API rate limits; use the production backend for
frontend-only verification.

### 4. Start the frontend development server

For frontend changes, use Vite and the production API directly:

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`. The default API URL is
`https://snakeroom.fly.dev`; override it with `VITE_API_URL` when needed.

To verify frontend files through the backend instead, run `npm run build` and
serve the generated `dist/` files, or build and run the Docker image.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Header: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v1.0"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green, class `label-success`)

### UI Functionality
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Theme selector: Light / Dark / High contrast / Industrial
- Charts: Recharts line charts rendered with SVG elements
- Refresh Data button triggers data reload

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: Vite + React 18 + TypeScript + Recharts + Tailwind CSS + TanStack Query
- Deployment: Fly.io (see `fly.toml`)
- Frontend polling runs every 30 seconds; backend collection and rate limiting
  are managed by the FastAPI service
