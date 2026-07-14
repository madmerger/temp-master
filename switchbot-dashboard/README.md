# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Modern SPA frontend built with Vite + React + TypeScript
- Temperature charts for all SwitchBot Meter devices using Recharts
- Light / dark theme toggle (respects `prefers-color-scheme`, persisted to `localStorage`); chart colors follow the active theme
- Time scale switching (hour/day/week/month/year)
- Stale meters (no update for 7+ days) are shown in a separate "未更新のメーター" section without charts
- Auto-refresh every 30 seconds (frontend) with background data collection every hour (backend, `DATA_COLLECTION_INTERVAL = 3600`)
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

3. (Optional) Copy `.env.example` to `.env` to override the API base URL:
   ```bash
   cp .env.example .env
   ```
   By default the frontend talks to the same origin. In dev, requests to `/api`
   are proxied to `http://localhost:8000` (see `vite.config.ts`). Set
   `VITE_API_URL` (e.g. `https://snakeroom.fly.dev`) to point elsewhere.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

### Production build

```bash
cd switchbot-frontend
npm run build   # outputs static assets to dist/
```

The Docker image builds the frontend in a Node stage and copies `dist/` into the
backend's `static/` directory, so FastAPI serves the compiled SPA at `/`.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads the SQLite database file

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
