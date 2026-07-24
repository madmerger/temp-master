# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Chart.js v4 (react-chartjs-2)
- Time scale switching (hour/day/week/month/year)
- Light / dark mode toggle (persisted in localStorage, respects `prefers-color-scheme`)
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached - GET endpoints never call SwitchBot API directly

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS, charts via Chart.js v4 / react-chartjs-2
- **Backend**: FastAPI + SQLite (aiosqlite), managed with Poetry
- **Deploy**: Docker multi-stage build (Node builds the frontend, FastAPI serves the built `dist/` at `/`)

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

   `VITE_API_URL` controls which backend the frontend calls. It defaults to
   `https://snakeroom.fly.dev`. Set it to an empty value to use the Vite dev
   proxy (`/api` → `http://localhost:8000`), configurable in `vite.config.ts`.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

#### Building the frontend

Produce a production bundle (output goes to `switchbot-frontend/dist/`):

```bash
npm run build
```

The backend serves the frontend from `switchbot-backend/static/`. To preview
the built assets through the backend locally, copy or symlink the build output:

```bash
# from switchbot-dashboard/
rm -rf switchbot-backend/static
cp -r switchbot-frontend/dist switchbot-backend/static
```

In production this happens automatically: the multi-stage `Dockerfile` runs
`npm ci && npm run build` in a Node stage and copies `dist/` into the backend
image's `static/` directory.

Type-check the frontend with:

```bash
npm run typecheck
```

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
