#!/usr/bin/env bash
# Use an already prepared frozen-spec scratch harness. Never runs in default scheme.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SIM="${E2E_SIMULATOR:-E0224A22-F874-4B8C-83FB-EB084492C493}"
ARTIFACTS="${E2E_ARTIFACTS:-$HOME/ios-artifacts}"
mkdir -p "$ARTIFACTS"
cd "$ROOT"
xcodegen generate
python3 scripts/e2e_host.py > "$ARTIFACTS/e2e-host.log" 2>&1 &
HOST_PID=$!
trap 'kill "$HOST_PID" 2>/dev/null || true' EXIT
xcodebuild test -project TempMaster.xcodeproj -scheme TempMasterE2E \
  -destination "platform=iOS Simulator,id=$SIM" \
  -parallel-testing-enabled NO \
  -derivedDataPath "$ARTIFACTS/E2EBuild" \
  -resultBundlePath "$ARTIFACTS/e2e-$(date +%Y%m%d_%H%M%S).xcresult" \
  "$@" > "$ARTIFACTS/e2e-xcodebuild.log" 2>&1
