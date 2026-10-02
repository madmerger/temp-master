# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
- Time scale switching (hour/day/week/month/year)
- Stale meters are highlighted in a separate section after one week without an update
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached - GET endpoints never call SwitchBot API directly
- Downloadable database backup

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

2. Install the locked dependencies:
   ```bash
   npm ci
   ```

3. Copy `.env.example` to `.env` and configure `VITE_API_URL` if needed:
   ```bash
   cp .env.example .env
   ```
   The default URL is `https://snakeroom.fly.dev`. Set `VITE_API_URL=` to use
   the same origin; during development, Vite proxies `/api` to
   `http://localhost:8000`.

4. Start the Vite development server (http://localhost:5173):
   ```bash
   npm run dev
   ```

5. Run frontend checks:
   ```bash
   npm run test
   npm run typecheck
   npm run lint
   npm run build
   ```

The dashboard Dockerfile uses a multi-stage Node 22 frontend build and serves
the resulting static assets from the Python backend image.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
