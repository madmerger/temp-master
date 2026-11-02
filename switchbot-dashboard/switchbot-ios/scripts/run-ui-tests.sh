#!/usr/bin/env bash
set -euo pipefail

# Requires macOS, Xcode, and an available iPhone simulator.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESULTS="$ROOT/TestResults"
PROJECT="$ROOT/SwitchBotDashboard.xcodeproj"

swift test --package-path "$ROOT/SwitchBotCore"
mkdir -p "$RESULTS"

DEVICE_ID="$(xcrun simctl list devices available -j | python3 -c '
import json, sys
devices = json.load(sys.stdin).get("devices", {})
print(next((device["udid"] for runtime in devices.values()
            for device in runtime
            if "iPhone" in device.get("name", "")
            and device.get("isAvailable", True)), ""))
')"
if [[ -z "$DEVICE_ID" ]]; then
    echo "No available iPhone simulator was found." >&2
    exit 1
fi

xcodebuild test \
    -project "$PROJECT" \
    -scheme SwitchBotDashboard \
    -destination "id=$DEVICE_ID" \
    -resultBundlePath "$RESULTS/SwitchBotDashboard.xcresult"
