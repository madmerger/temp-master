# Temp Master Dashboard

A full-stack dashboard for monitoring temperature, humidity, and battery readings from SwitchBot Meter devices.

## Features

- React 19 and TypeScript frontend built with Vite
- Temperature history charts with Chart.js 4 and `react-chartjs-2`
- Light and dark themes, with the system preference used until a theme is selected
- Time ranges for the last hour, 24 hours, 7 days, 30 days, or year
- Active and stale meter groups, refreshed every 30 seconds
- Rate-limit status and a downloadable database backup

## Requirements

- Python 3.12+
- Node.js 24 LTS (Node.js 22 or newer is supported)
- Poetry

## Setup

### Backend

1. Open the backend directory:

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

   Get the token from the SwitchBot app under Profile > Preferences > About. Tap App Version 10 times to enable Developer Options, then select Developer Options > Get Token.

4. Start the backend:

   ```bash
   poetry run fastapi dev app/main.py
   ```

### Frontend

1. In a second terminal, open the frontend directory:

   ```bash
   cd switchbot-dashboard/switchbot-frontend
   ```

2. Install dependencies and start Vite:

   ```bash
   npm ci
   npm run dev
   ```

   Vite serves the dashboard at <http://localhost:5173> and proxies `/api` requests to the backend at <http://localhost:8000>.

3. `VITE_API_URL` is empty by default, which uses the same origin as the frontend. Set it in a local `.env` file to override the API base URL:

   ```dotenv
   VITE_API_URL=https://api.example.com
   ```

   Docker builds default to `https://snakeroom.fly.dev`.

### Frontend commands

Run these from `switchbot-dashboard/switchbot-frontend`:

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

## Docker

From the repository root, build the multi-stage dashboard image:

```bash
docker build -t temp-master switchbot-dashboard
```

To set a different API base URL at build time:

```bash
docker build \
  --build-arg VITE_API_URL=https://api.example.com \
  -t temp-master switchbot-dashboard
```

The image serves the compiled frontend through FastAPI on port 8000.

## API endpoints

- `GET /api/meters` - Returns meter devices and their current readings
- `GET /api/meters/{device_id}/history?time_scale=hour|day|week|month|year` - Returns readings for a time range
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and rate-limit information
- `GET /api/backup` - Downloads a SQLite database snapshot from the app serving the frontend
- `GET /healthz` - Health check

## Notes

- Meter history is stored in SQLite and survives backend restarts.
- The frontend refresh interval is 30 seconds. The backend collector runs independently.
- SwitchBot API requests are subject to rate limits; the backend applies an exponential backoff.
