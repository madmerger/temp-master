# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

- **Backend:** FastAPI + SQLite (aiosqlite)
- **Frontend:** React + TypeScript + Vite + Recharts

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
- Time scale switching (hour/day/week/month/year)
- Active vs. stale meter separation (devices with no update for 7+ days)
- Light / dark theme toggle, persisted in `localStorage` (defaults to the OS `prefers-color-scheme`)
- Auto-refresh every 30 seconds (frontend) with background data collection (backend)
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

3. (Optional) Configure the API base URL. By default the frontend calls the
   backend on the **same origin** using relative paths, so no configuration is
   needed when the backend serves the built frontend. To point at a remote
   backend during development, copy `.env.example` to `.env` and set
   `VITE_API_URL`:
   ```bash
   cp .env.example .env
   # e.g. VITE_API_URL=https://temp-master.fly.dev
   ```
   The Vite dev server also proxies `/api` to `http://localhost:8000` (see
   `vite.config.ts`).

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

6. Build for production:
   ```bash
   npm run build
   ```
   The build output is written to `switchbot-frontend/dist/`. The Docker image
   (see `Dockerfile`) builds the frontend in a Node stage and copies `dist/`
   into the backend's `static/` directory, which FastAPI serves at `/`.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads the SQLite database file for backup

## Notes

- Temperature history is persisted in SQLite and survives backend restarts
- Backend data collection interval: 1 hour (`DATA_COLLECTION_INTERVAL = 3600`)
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
