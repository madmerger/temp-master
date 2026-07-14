# Temp Master Dashboard

A full-stack web dashboard for monitoring temperature, humidity, and battery readings
from SwitchBot Meter devices.

## Features

- Responsive React dashboard with Recharts temperature history
- Light, Dark, and Aurora themes using CSS variables
- Saved theme preference with system dark-mode detection on first visit
- Time scale switching (hour/day/week/month/year)
- Temperature, humidity, and battery status for every meter
- Separate section for meters that have not updated in seven days
- Manual refresh and SQLite database backup controls
- Auto-refresh every 30 seconds with hourly background data collection
- Rate limiting protection with exponential backoff
- Cached GET endpoints that never call the upstream API directly

## Stack

- Frontend: React 19, TypeScript, Vite, Recharts
- Backend: FastAPI, aiosqlite, SQLite, Poetry
- Deployment: Multi-stage Docker image on Fly.io

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

1. In another terminal, navigate to the frontend directory:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Optionally configure a different API origin:
   ```bash
   cp .env.example .env
   ```

   `VITE_API_URL` defaults to an empty value, so `/api/...` uses the same origin.
   During development Vite proxies `/api` to `http://localhost:8000`.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

### Production-style local build

Build the frontend and expose it through FastAPI:

```bash
cd switchbot-frontend
npm ci
npm run build
cd ..
ln -sfn "$(pwd)/switchbot-frontend/dist" switchbot-backend/static
cd switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

Open http://localhost:8000. FastAPI serves static assets from `dist` and falls back to
`dist/index.html` for client-side routes.

## Frontend checks

```bash
cd switchbot-frontend
npm run lint
npm run build
```

## Backend tests

```bash
cd switchbot-backend
poetry run pytest -v
```

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history?time_scale=...` - Returns temperature history
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads the SQLite database

## Notes

- Temperature history is persisted in SQLite
- Backend data collection interval: 1 hour
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
