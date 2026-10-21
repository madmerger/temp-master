# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices
- Time scale switching (hour/day/month/year)
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
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
   cd switchbot-dashboard/switchbot-frontend
   ```

2. Install dependencies from the lockfile:
   ```bash
   npm ci
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

Available scripts: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `npm run test:e2e`.

Open http://localhost:5173 in your browser. `VITE_API_URL` defaults to an empty value, which uses same-origin API paths; development requests are proxied to `http://localhost:8000`. Set `VITE_API_URL` to override the API origin.

Production continues to serve `switchbot-frontend/legacy/index.html` until the React build is wired into the Docker image by the Docker multi-stage ticket.

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
