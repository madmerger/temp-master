# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Chart.js v4 (react-chartjs-2)
- **Backend**: FastAPI + aiosqlite (SQLite persistence)

## Features

- Temperature charts for all SwitchBot Meter devices (Chart.js v4 line charts)
- Time scale switching (Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year)
- Light/dark theme toggle (persisted to localStorage, defaults to `prefers-color-scheme`)
- Stale-meter section: devices not updated for 7+ days are shown separately under 「未更新のメーター」
- Auto-refresh every 30 seconds (frontend) with background data collection every hour (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached - GET endpoints never call SwitchBot API directly

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd switchbot-backend
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Copy `.env.example` to `.env` and add your SwitchBot credentials:
   ```bash
   cp .env.example .env
   ```

   Get your credentials from the SwitchBot app:
   - Go to Profile > Preferences > About
   - Tap App Version 10 times to enable Developer Options
   - Go to Developer Options > Get Token

4. Start the development server:
   ```bash
   poetry run fastapi dev app/main.py
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Leave `VITE_API_URL` empty for same-origin requests — the Vite dev server proxies `/api` to `http://localhost:8000`.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

### Production build

```bash
npm run build
```

This runs `tsc --noEmit` and outputs static files to `dist/`. In production the FastAPI backend serves `dist/` at `/` (see `switchbot-backend/static` in deployment). `npm run typecheck` runs the TypeScript check alone.

### Docker

The `Dockerfile` is multi-stage: a `node:22-alpine` stage builds the frontend (`npm ci && npm run build`), and the `python:3.12-slim` stage installs backend dependencies with Poetry and copies the built `dist/` into `./static/`, which FastAPI serves at `/`.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with `time_scale` parameter (hour/day/week/month/year)
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads a backup copy of the SQLite database
- `GET /api/latency-logs` - Returns SwitchBot API request latency logs
- `GET /api/latency-stats` - Returns aggregated latency statistics
- `POST /api/import` - Imports historical data from another backend instance

## Notes

- Temperature history is persisted in SQLite (`/data/app.db` or local `app.db`)
- Backend data collection interval: 1 hour
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
