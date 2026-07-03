---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 20+ (frontend build)
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

### 3. Install frontend dependencies

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
```

### 4. Start the frontend dev server (with proxy to backend)

```bash
cd switchbot-dashboard/switchbot-frontend
npm run dev -- --host 0.0.0.0
```

The Vite dev server runs at `http://localhost:5173` and proxies `/api` requests to the backend at `http://localhost:8000`.

### 5. Start the backend server (separate terminal)

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

### Alternative: Frontend-only testing with production backend

If testing frontend-only changes, change `vite.config.ts` proxy target to `https://temp-master.fly.dev` temporarily:

```typescript
'/api': {
  target: 'https://temp-master.fly.dev',
  changeOrigin: true,
  secure: true,
},
```

Then run `npm run dev -- --host 0.0.0.0` and test at `http://localhost:5173`. Revert the proxy target before committing.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + TypeScript + Tailwind CSS"
- Verify no "Snake" or "SnakeRoom" text exists anywhere

### Theme Verification
- Theme switcher in navbar: Light / Dark / System / High Contrast options
- Switching theme changes background, panels, badges, and chart colors visibly
- Theme persists in localStorage (`temp-master-theme` key) and restores on reload
- System theme follows OS preference

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green)

### UI Functionality
- Meter grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts line charts rendered inside each panel
- Refresh Data button triggers data reload
- Download Backup button opens backup URL

## Building for Production

```bash
cd switchbot-dashboard/switchbot-frontend
npm run build
```

This produces a `dist/` directory ready to be served by the backend.

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Docker Build

```bash
cd switchbot-dashboard
docker build -t temp-master .
docker run -p 8000:8000 --env-file switchbot-backend/.env temp-master
```

The React app is served at `http://localhost:8000/`.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + Recharts
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
