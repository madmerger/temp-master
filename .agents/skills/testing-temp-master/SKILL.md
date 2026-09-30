---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally (Vite + React frontend, FastAPI backend). Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Frontend-only changes (no local backend needed)

The frontend API base is `VITE_API_URL`, defaulting to `https://snakeroom.fly.dev` (see `src/api.ts`). Its read-only endpoints are public and have live data, so no backend or SwitchBot credentials are needed.

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run dev -- --host 0.0.0.0   # http://localhost:5173
```

- Restart Vite after changing `.env` / `VITE_API_URL`.
- Error-state check: run a second instance against an unreachable API, e.g. `VITE_API_URL=http://localhost:9 npm run dev -- --port 5174` → red "Disconnected" badge + error alert.
- Local backend instead: set `VITE_API_URL=` (empty); the dev server proxies `/api` to `http://localhost:8000`.

## Key Test Points

- Navbar: "Temp Master Dashboard", Connected/Disconnected badge, dark-mode toggle (top right).
- Status bar "Monitoring N meters" + "Last refresh"; rate-limit warning when `is_rate_limited`.
- Meter cards: `DISPLAY_NAMES` mapping (`src/meters.ts`), temp/humidity/battery badges, Recharts line chart (SVG, not canvas), 200px tall.
- Stale meters (`last_updated` missing or ≥7 days old) appear in the "未更新のメーター" section without a chart and without history requests. Cross-check with `curl https://snakeroom.fly.dev/api/meters`; verify by `device_id` since names can repeat.
- Time Range (hour/day/week/month/year): X axis `HH:MM` / `Mon 13` / `Sep 30`.
- Refresh Data: POST `/api/meters/refresh`, button disabled ("Refreshing...") then data refetched.
- Auto refresh: `/api/meters` and `/api/status` requested in parallel every 30s (capture a timestamped network log over 3 cycles).
- Dark mode: remove `localStorage.theme` and emulate `prefers-color-scheme` to check the initial value; a saved `light`/`dark` value takes priority and persists across reloads.
- Download Backup opens `<API>/api/backup` in a new tab. The snakeroom backend returns 401 `Not authenticated` for unauthenticated requests — report URL behavior and actual download separately; a 401 is not a UI regression.

## Full stack / Docker

```bash
cd switchbot-dashboard
docker build -t temp-master-test .   # multi-stage: builds frontend dist -> static/
docker run --rm -p 8000:8000 temp-master-test
```

## Backend tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry install --no-interaction
poetry run pytest -v
```

## Devin Secrets Needed

- Frontend verification against the public API: none.
- Local backend collecting from real devices only: `SWITCHBOT_TOKEN`, `SWITCHBOT_SECRET` in `switchbot-backend/.env`.
