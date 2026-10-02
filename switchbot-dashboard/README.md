# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
- Time scale switching (hour/day/week/month/year)
- Meters not updated for 7+ days are shown in a separate section
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

React 19 / TypeScript / Vite / Tailwind CSS / Recharts.

1. Navigate to the frontend directory:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. (Optional) Copy `.env.example` to `.env` to point the frontend at a remote backend:
   ```bash
   cp .env.example .env
   ```

   `VITE_API_URL` is the base URL used for all `/api/*` calls. When it is unset/empty, the
   frontend uses same-origin requests and `npm run dev` proxies `/api` to `http://localhost:8000`.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

Other scripts:

- `npm run typecheck` - TypeScript type check
- `npm run lint` - Lint with oxlint
- `npm run build` - Production build to `dist/`

### Docker

The `Dockerfile` is a multi-stage build: a Node stage runs `npm ci && npm run build`, and the
resulting `dist/` is copied to `./static/`, which FastAPI serves at `/`. The API base URL is baked in
at build time via the `VITE_API_URL` build arg (default: `https://snakeroom.fly.dev`):

```bash
docker build --build-arg VITE_API_URL=https://snakeroom.fly.dev -t temp-master .
```

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
