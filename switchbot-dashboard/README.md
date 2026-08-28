# Temp Master Dashboard

A full-stack web dashboard for monitoring temperature readings from environmental
meters.

## Features

- React 18 + Vite + TypeScript frontend
- Tailwind CSS 3.4 styling with a persistent light/dark theme toggle
- Recharts temperature history charts
- Time scale switching (hour/day/week/month/year)
- Auto-refresh every 30 seconds (frontend) with background data collection every
  hour (backend)
- Stale-meter grouping and rate-limit status reporting
- Cached API reads that do not call the upstream service directly

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

3. Copy `.env.example` to `.env` and add the service credentials:
   ```bash
   cp .env.example .env
   ```

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
   npm ci
   ```

3. Copy `.env.example` to `.env` and adjust the API URL if needed:
   ```bash
   cp .env.example .env
   ```

   `VITE_API_URL` defaults to an empty string for same-origin production
   requests. The example value, `http://localhost:8000`, is convenient for
   local Vite development.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser.

## API Endpoints

- `GET /api/meters` - Returns all meter devices with current readings
- `GET /api/meters/{device_id}/history?time_scale=` - Returns temperature history
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads the database backup

## Deployment

The `Dockerfile` uses a multi-stage build. The Node 22 frontend stage runs
`npm ci` and `npm run build`; the Python stage serves the resulting `dist`
directory from `/` through the backend SPA catch-all.

## Notes

- Temperature history is persisted by the backend database.
- Backend data collection interval: 1 hour (`DATA_COLLECTION_INTERVAL = 3600`).
- Frontend refresh interval: 30 seconds.
- The upstream service has strict rate limits, so reads use cached data.
