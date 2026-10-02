#!/usr/bin/env bash
# reset_and_seed.sh [port] [db_path]
# Full reset: stop backend on the port, delete the DB file, restart via
# start_legacy.sh (no credentials), wait for /healthz, run seed_legacy.py.
set -euo pipefail

PORT="${1:-8000}"
HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HARNESS_DIR/../../.." && pwd)"
DB_PATH="${2:-$REPO_ROOT/docs/ios-migration/results/legacy_seed_${PORT}.db}"

echo "== Stopping backend on port $PORT" >&2
PIDS="$(lsof -ti tcp:$PORT 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  kill $PIDS 2>/dev/null || true
  sleep 1
  PIDS="$(lsof -ti tcp:$PORT 2>/dev/null || true)"
  [ -n "$PIDS" ] && kill -9 $PIDS 2>/dev/null || true
fi

echo "== Deleting DB $DB_PATH" >&2
rm -f "$DB_PATH"

echo "== Starting backend" >&2
"$HARNESS_DIR/start_legacy.sh" "$PORT" "$DB_PATH"

echo "== Seeding" >&2
python3 "$HARNESS_DIR/seed_legacy.py" --base-url "http://localhost:$PORT" --db-path "$DB_PATH"
echo "== Done. Backend running on port $PORT, db: $DB_PATH" >&2
