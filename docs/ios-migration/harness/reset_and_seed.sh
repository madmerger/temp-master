#!/usr/bin/env bash
# reset_and_seed.sh [port] [db_path] [--with-creds] [--no-seed]
# Full reset: stop backend on the port, delete the DB file, restart it,
# wait for /healthz, and seed unless --no-seed was requested.
set -euo pipefail

PORT="${1:-8000}"
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HARNESS_DIR/../../.." && pwd)"
RESULTS_DIR="$REPO_ROOT/docs/ios-migration/results"
DB_PATH="${2:-$RESULTS_DIR/instances/$PORT/app.db}"
WITH_CREDS=false
NO_SEED=false
for flag in "${@:3}"; do
  case "$flag" in
    --with-creds) WITH_CREDS=true ;;
    --no-seed) NO_SEED=true ;;
    *)
      echo "ERROR: unknown flag: $flag" >&2
      exit 1
      ;;
  esac
done

port_pids() {
  lsof -ti "tcp:$PORT" 2>/dev/null || true
}

validate_backend_pids() {
  local pid command
  for pid in $1; do
    command="$(ps -o args= -p "$pid" 2>/dev/null || true)"
    if [[ "$command" == *uvicorn* && "$command" == *app.main* ]] ||
      [[ "$command" == *fastapi* && "$command" == *app/main.py* ]]; then
      continue
    else
      echo "ERROR: refusing to stop PID $pid on port $PORT; it is not a recognized FastAPI backend." >&2
      return 1
    fi
  done
}

echo "== Stopping backend on port $PORT" >&2
PIDS="$(port_pids)"
if [ -n "$PIDS" ]; then
  validate_backend_pids "$PIDS"
  for PID in $PIDS; do
    kill "$PID" 2>/dev/null || true
  done
  sleep 1
  PIDS="$(port_pids)"
  if [ -n "$PIDS" ]; then
    validate_backend_pids "$PIDS"
    for PID in $PIDS; do
      kill -9 "$PID" 2>/dev/null || true
    done
  fi
fi

DB_DIR="$(dirname "$DB_PATH")"
mkdir -p "$DB_DIR"
echo "== Deleting DB $DB_PATH" >&2
rm -f "$DB_PATH"

case "$PORT" in
  8000)
    mkdir -p "$DB_DIR/backups"
    rm -f "$DB_DIR"/backups/*
    ;;
  8002)
    rm -rf "$DB_DIR/backups"
    ;;
esac

echo "== Starting backend" >&2
if [ "$WITH_CREDS" = true ]; then
  "$HARNESS_DIR/start_legacy.sh" "$PORT" "$DB_PATH" --with-creds
else
  "$HARNESS_DIR/start_legacy.sh" "$PORT" "$DB_PATH"
fi

if [ "$NO_SEED" != true ]; then
  echo "== Seeding" >&2
  python3 "$HARNESS_DIR/seed_legacy.py" --base-url "http://localhost:$PORT" --db-path "$DB_PATH"
fi
echo "== Done. Backend running on port $PORT, db: $DB_PATH" >&2
