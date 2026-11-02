# Temp Master Dashboard

A full-stack web dashboard for monitoring temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Chart.js 4 and react-chartjs-2
- Time scale switching (hour/day/week/month/year)
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached; GET endpoints never call SwitchBot API directly
- Light and dark themes, following the operating-system preference by default

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd switchbot-dashboard/switchbot-backend
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

2. Install the locked dependencies with `npm ci` (or use `npm install` when changing dependencies).

3. Copy `.env.example` to `.env` to configure local environment values:
   ```bash
   cp .env.example .env
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

   The dashboard is available at http://localhost:5173. Vite proxies `/api` requests to `http://localhost:8000` by default; set `VITE_DEV_PROXY_TARGET` to use a different backend.

5. Run frontend checks as needed:
   ```bash
   npm run build
   npm test
   npm run lint
   npm run typecheck
   ```

The frontend supports these environment variables:

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Optional API base URL. When unset, `npm run dev` uses same-origin requests and production builds use `https://snakeroom.fly.dev`. Set it (including to an empty string for same-origin) to override either default. |
| `VITE_STALE_METER_THRESHOLD_MS` | Milliseconds before a meter is considered stale; defaults to seven days. |
| `VITE_DEV_PROXY_TARGET` | Optional target for the Vite `/api` development proxy; defaults to `http://localhost:8000`. |

The theme toggle switches between light and dark. Without a saved choice, the dashboard follows `prefers-color-scheme`; a user selection is saved in local storage.

## Docker

Build from the repository root:

```bash
docker build -t temp-master switchbot-dashboard
```

The frontend is compiled in the Node 24 build stage. Override its API base URL with `--build-arg VITE_API_URL=https://api.example.com`; the default is configured for the deployed API. The backend serves the generated frontend `dist` files from `/`.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with a `time_scale` parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)

## Dependency audit

- `python:3.12-slim` is supported until 2028-10; Poetry is pinned to 2.5.1.
- Node 24 LTS is used for the frontend build stage.
- `psycopg` is declared in `pyproject.toml` but unused; removing it requires regenerating the lockfile and is a follow-up.
- The CI deploy workflow uses `superfly/flyctl-actions/setup-flyctl@master` without a pinned revision; pinning it is a follow-up.
