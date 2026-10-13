#!/usr/bin/env bash
# start_legacy.sh [port] [db_path] [--with-creds]
# Starts the legacy FastAPI backend in the background.
# By default SWITCHBOT_TOKEN/SECRET are explicitly emptied so no data
# collection happens. --with-creds keeps the real env credentials
# (used only for TC-18 on a separate port/DB).
set -euo pipefail

PORT="${1:-8000}"
DB_PATH="${2:-$(pwd)/legacy_seed.db}"
WITH_CREDS="${3:-}"

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HARNESS_DIR/../../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/switchbot-dashboard/switchbot-backend"
RESULTS_DIR="$REPO_ROOT/docs/ios-migration/results"
mkdir -p "$RESULTS_DIR"

if [ -f "$BACKEND_DIR/.env" ]; then
  echo "WARNING: $BACKEND_DIR/.env exists; load_dotenv() in main.py may pick it up." >&2
fi

cd "$BACKEND_DIR"
LOG="$RESULTS_DIR/legacy_backend_${PORT}.log"
PIDFILE="$RESULTS_DIR/legacy_backend_${PORT}.pid"

if [ "$WITH_CREDS" = "--with-creds" ]; then
  echo "Starting legacy backend WITH SwitchBot credentials on port $PORT (db: $DB_PATH)" >&2
  DB_PATH="$DB_PATH" nohup poetry run fastapi run app/main.py --port "$PORT" >"$LOG" 2>&1 &
else
  echo "Starting legacy backend WITHOUT credentials on port $PORT (db: $DB_PATH)" >&2
  DB_PATH="$DB_PATH" SWITCHBOT_TOKEN="" SWITCHBOT_SECRET="" \
    nohup poetry run fastapi run app/main.py --port "$PORT" >"$LOG" 2>&1 &
fi

echo $! > "$PIDFILE"
echo "PID $(cat "$PIDFILE"), log: $LOG" >&2

for i in $(seq 1 60); do
  if curl -sf "http://localhost:$PORT/healthz" >/dev/null 2>&1; then
    echo "Backend healthy on port $PORT" >&2
    exit 0
  fi
  sleep 1
done
echo "ERROR: backend did not become healthy; see $LOG" >&2
exit 1
