# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
- Time scale switching (hour/day/week/month/year)
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached - GET endpoints never call SwitchBot API directly
- Multiple UI themes (Light / Dark / Ocean / Sunset) switchable from the navbar

## Tech Stack

- **Backend:** FastAPI + SQLite (aiosqlite), Poetry
- **Frontend:** React + Vite + TypeScript, charts via Recharts, theming via CSS variables

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
   By default the dev server proxies `/api` requests to the backend on
   `http://localhost:8000` (see `vite.config.ts`), so no `.env` is required
   for local development.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

To create a production build (output in `dist/`):
```bash
npm run build
```

### API base URL resolution

The frontend resolves its API base URL as follows (see `src/api.ts`):

- If `VITE_API_URL` is set at build/dev time, it is used as-is.
- Otherwise, if the page is opened via `file://`, it falls back to
  `https://temp-master.fly.dev`.
- Otherwise it uses the same origin (empty base URL).

In production the FastAPI backend serves the built `dist/` as static files, so
the same-origin default is correct and **no `.env` is needed**. The Docker image
intentionally does not include `.env` (it is excluded via `.dockerignore`); the
`.env` file is only for optionally overriding `VITE_API_URL` during local dev.

## Themes

The frontend ships with four themes — **Light**, **Dark**, **Ocean**, and
**Sunset** — implemented with CSS variables (`src/index.css`). Switch themes
from the selector in the navbar; the choice is persisted to `localStorage`.
Recharts chart colors follow the active theme (see `src/themes.ts`), keeping
the graphs legible on dark backgrounds.

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
