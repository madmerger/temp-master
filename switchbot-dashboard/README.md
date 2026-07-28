# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using React + Recharts
- Light / dark mode toggle (persisted in `localStorage`, defaults to `prefers-color-scheme`)
- Time scale switching (hour/day/week/month/year)
- Stale meter section for devices with no updates for over 7 days
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
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and set the backend URL:
   ```bash
   cp .env.example .env
   ```

   `VITE_API_URL` is the base URL for all API calls (default: `https://snakeroom.fly.dev`).
   Use `VITE_API_URL=http://localhost:8000` to talk to a local backend, or set it to an
   empty value to call the same origin that serves the app.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

The frontend is a React 18 + TypeScript + Vite app (charts via Recharts):

- `src/api/` - API client (`/api/meters`, `/api/status`, `/api/meters/{id}/history`, `POST /api/meters/refresh`, `/api/backup`)
- `src/components/` - `Navbar`, `Controls`, `StatusBar`, `RateLimitWarning`, `MeterGrid`, `MeterPanel`, `StaleMetersSection`, `TemperatureChart`
- `src/context/ThemeContext.tsx` - light/dark theme state, persisted in `localStorage`
- `src/constants.ts` - Japanese device display names, refresh/stale thresholds

Other scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build into dist/
```

Production builds are served by the backend: the Docker image builds `dist/` in a Node
stage and copies it into the backend's `static/` directory.

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
