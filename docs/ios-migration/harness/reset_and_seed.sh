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
WITH_CREDS="${3:-}"
NO_SEED="${4:-}"

echo "== Stopping backend on port $PORT" >&2
PIDS="$(lsof -ti tcp:$PORT 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  kill $PIDS 2>/dev/null || true
  sleep 1
  PIDS="$(lsof -ti tcp:$PORT 2>/dev/null || true)"
  [ -n "$PIDS" ] && kill -9 $PIDS 2>/dev/null || true
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
"$HARNESS_DIR/start_legacy.sh" "$PORT" "$DB_PATH" "$WITH_CREDS"

if [ "$NO_SEED" != "--no-seed" ]; then
  echo "== Seeding" >&2
  python3 "$HARNESS_DIR/seed_legacy.py" --base-url "http://localhost:$PORT" --db-path "$DB_PATH"
fi
echo "== Done. Backend running on port $PORT, db: $DB_PATH" >&2
