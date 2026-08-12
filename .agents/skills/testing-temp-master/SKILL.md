---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- SwitchBot API credentials

## Devin Secrets Needed

- `SWITCHBOT_TOKEN` - SwitchBot API token
- `SWITCHBOT_SECRET` - SwitchBot API secret

## Local Development Setup

### 1. Install dependencies

```bash
cd switchbot-dashboard/switchbot-backend
poetry install --no-interaction
```

### 2. Create .env file

```bash
cd switchbot-dashboard/switchbot-backend
echo "SWITCHBOT_TOKEN=${SWITCHBOT_TOKEN}" > .env
echo "SWITCHBOT_SECRET=${SWITCHBOT_SECRET}" >> .env
```

### 3. Frontend

The frontend is a Vite + React application. Install dependencies and start Vite on port 5173:

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run dev -- --host 0.0.0.0
```

The frontend reads `VITE_API_URL` from `.env`; when unset, it defaults to `https://snakeroom.fly.dev`. The production Docker image serves the Vite `dist/` output from FastAPI's `static/` directory.

### 4. Optional local backend

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

For frontend-only verification, use the production backend rather than the local backend because SwitchBot API rate limiting can leave local data empty. Set `VITE_API_URL=https://snakeroom.fly.dev` (the default) and use `http://localhost:5173`.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v1.0"

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status indicator shows "Connected"
- `GET https://snakeroom.fly.dev/api/backup` currently returns `401`; `https://temp-master.fly.dev/api/backup` returns `200`

### UI Functionality
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts temperature line charts
- Refresh Data button triggers data reload
- Header theme toggle switches and persists light/dark mode

### Verifying charts actually re-fetch (do not trust screenshots alone)
A screenshot of a line chart looks similar across time scales. Count data points and read
axis ticks instead:

```js
const a = [...document.querySelectorAll('article')].find(x => x.textContent.includes('第1蒸留塔'));
JSON.stringify({
  dots: a.querySelectorAll('.recharts-line-dot').length,
  ticks: [...a.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-value')].map(t => t.textContent),
});
```

Expected x-axis label formats (see `src/components/TemperatureChart.tsx` `formatTimestamp`):
`hour`/`day` -> `HH:MM`; `week` -> `Www HH` (e.g. `Wed 04`); `month`/`year` -> `Mmm D` (e.g. `Aug 12`).
Against snakeroom the point counts differ per scale (roughly hour ~16, day ~75, week ~170),
which is a reliable signal that a re-fetch happened.

### Polling / loading-state regressions
The app polls every 30 s. To prove charts do not flip back to a loading placeholder during
background polls, sample the DOM over more than one poll interval instead of eyeballing it:

```js
window.__hits = 0; window.__n = 0;
window.__p = setInterval(() => { window.__n++; if (document.body.innerText.includes('Loading temperature history')) window.__hits++; }, 200);
// wait ~70 s, then: clearInterval(window.__p); ({n: window.__n, hits: window.__hits})
```

### Dark mode
- Toggle is the ☾/☀ button at the top right of the header (`aria-label="Toggle dark mode"`).
- Persisted in `localStorage['temp-master-dark-mode']` (`'true'`/`'false'`), written only on an
  explicit toggle. An inline script in `index.html` applies `html.dark` before React mounts to
  avoid a light-theme flash — verify by screenshotting immediately after reload while the cards
  still show the history placeholder; the page must already be dark.

### Stale meters section
Meters whose `last_updated` is missing or ≥ 7 days old render in a separate 「⚠ 未更新のメーター」
section with a 「7日以上未更新」 badge, no chart, and 「履歴データの取得対象外」. On snakeroom there is
normally exactly one such device (`F577B677EC96`), so this section is testable against production
data without any fixtures. Check `/api/meters` `last_updated` values first to know how many to expect.

### Known quirks (not necessarily bugs)
- Display names are mapped by *device name* in `src/App.tsx` (`DISPLAY_NAMES`). Two devices share the
  name `夢男`, so two cards can both show 「熱交換器 (E-301)」. Devices missing from the map (`Study Hub`,
  `Livingroom Hub`, `Bedroom Hub`, `ガー子ケージ`, `極道`) render their raw names.
- Some devices report `0`°C / `0`% and are rendered as-is (only `null` is hidden).

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: Vite + React 18 + TypeScript, Tailwind CSS (`darkMode: 'class'`), Recharts
  (`src/App.tsx` state/polling/controls, `src/components/MeterCard.tsx`,
  `src/components/TemperatureChart.tsx`, `src/api.ts` fetch client, `src/types.ts`)
- There is no Vite proxy: the app calls `VITE_API_URL` (default `https://snakeroom.fly.dev`) directly
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
