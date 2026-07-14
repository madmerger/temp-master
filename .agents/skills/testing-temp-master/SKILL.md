---
name: testing-temp-master
description: Test the Temp Master React/Vite SwitchBot dashboard locally. Use when verifying dashboard UI, API connectivity, charts, themes, refresh behavior, backups, or container delivery.
---

# Testing Temp Master Dashboard

## Devin Secrets Needed

- None when testing the frontend against the public API configured by `VITE_API_URL`.
- `SWITCHBOT_TOKEN` and `SWITCHBOT_SECRET` only when running a locally configured backend that must collect fresh SwitchBot data.

## Frontend Setup

```bash
cd switchbot-dashboard/switchbot-frontend
npm ci
npm run dev
```

Vite serves the app at `http://localhost:5173`. The default API is `https://snakeroom.fly.dev`; override it when needed:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

Before UI testing, verify the configured API:

```bash
API_URL="${VITE_API_URL:-https://snakeroom.fly.dev}"
curl -fsS "$API_URL/api/status"
curl -fsS "$API_URL/api/meters"
```

## Optional Local Backend Integration

Frontend-only tests should use the default public API. To test against a local backend with fresh SwitchBot data, start FastAPI in one terminal:

```bash
cd switchbot-dashboard/switchbot-backend
poetry install --no-interaction
printf 'SWITCHBOT_TOKEN=%s\nSWITCHBOT_SECRET=%s\n' \
  "$SWITCHBOT_TOKEN" "$SWITCHBOT_SECRET" > .env
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

Then start Vite in another terminal:

```bash
cd switchbot-dashboard/switchbot-frontend
VITE_API_URL=http://localhost:8000 npm run dev
```

Do not create a `switchbot-backend/static` symlink for local development; Vite serves the React source directly.

## Browser Test Flow

1. Confirm the title and navbar say `Temp Master Dashboard`, no visible `Snake` or `SnakeRoom` branding appears, the connection says `Connected`, the meter count is present, and no error banner is shown. The configured API hostname may still contain `snakeroom.fly.dev`.
2. Confirm cards show temperature, humidity, optional battery, Japanese aliases, and SVG charts rendered by Recharts.
3. Scroll to `未更新のメーター`; stale cards should show the stale warning and `履歴データの取得対象外`, without a chart.
4. Switch among hour/day/week/month/year. Wait for history requests to settle before judging empty charts; hover a chart and confirm the tooltip value ends in `°C`.
5. Toggle dark mode and verify the page, panels, text, chart lines, axes, and grid all change. Reload and confirm persistence.
6. Click `Refresh Data`; confirm the disabled `Refreshing...` state, recovery to the normal label, and an advanced `Last refresh`.
7. Wait more than 30 seconds and confirm `Last refresh` advances automatically while remaining connected.
8. Click `Download Backup`; confirm an actual `switchbot_backup_*.db` download. A JSON authentication response is a failure and may indicate that the configured API deployment differs from the repository backend.
9. Check the API's `is_rate_limited` and `backoff_remaining`. Do not exhaust a production quota to manufacture the positive warning state.

## Container Verification

```bash
cd switchbot-dashboard
docker build -t temp-master-test .
docker run --rm -p 8000:8000 temp-master-test
```

Verify `/`, `/healthz`, and an unknown frontend route. The unknown route should return the React `index.html` through the FastAPI SPA fallback.

To embed a different API URL in the production bundle:

```bash
docker build --build-arg VITE_API_URL=https://example.com -t temp-master-test .
```

Frontend `.env*` files are intentionally excluded from the Docker context, so container builds use the Docker build argument rather than local frontend env files.

## Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

## Runtime Architecture

- Frontend: React 18 + TypeScript + Vite + Recharts
- Backend: FastAPI + aiosqlite
- Frontend development port: 5173
- Container port: 8000
- Production frontend assets: built in a Node stage and copied to `/app/static`
