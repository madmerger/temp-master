# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Chart.js
- Time scale switching (hour/day/week/month/year)
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached - GET endpoints never call SwitchBot API directly
- Light, dark, and system theme options

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

3. Optionally override the API URL locally with `.env.local`:
   ```bash
   echo 'VITE_API_URL=https://snakeroom.fly.dev' > .env.local
   ```
   An empty or unset `VITE_API_URL` uses same-origin requests and the Vite dev proxy to `http://localhost:8000`. The Docker image builds with `VITE_API_URL=https://snakeroom.fly.dev` by default; override it with `--build-arg VITE_API_URL=...`.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

Available frontend commands:

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test:e2e
npm run report:e2e
```

The dashboard supports Light, Dark, and System themes. Playwright E2E tests use a mocked API. The Dockerfile builds the Vite frontend in a Node stage and copies the output into the Python image.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads a database backup

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
