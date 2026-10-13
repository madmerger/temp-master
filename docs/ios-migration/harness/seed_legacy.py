#!/usr/bin/env python3
"""Seed the legacy SwitchBot dashboard backend per docs/ios-migration/fixtures.md.

stdlib only. POSTs base.json to --base-url/api/import, then INSERTs the
latency_logs rows directly into the SQLite DB at --db-path.

Also: --write-import-extra PATH generates import_extra.json (SEED-D7) with
NOW-relative timestamps, for TC-16.
"""
import argparse
import json
import sqlite3
import sys
import urllib.request
from datetime import datetime, timedelta, timezone


def now_utc():
    return datetime.now(timezone.utc)


def iso(dt):
    return dt.isoformat()


def build_base(now):
    def dev(did, name, dtype, temp, hum, bat, lu_offset, readings):
        readings = [
            {"timestamp": iso(now + timedelta(seconds=off)),
             "temperature": t, "humidity": h, "battery": b}
            for off, t, h, b in readings
        ]
        return {
            "device_id": did,
            "device_name": name,
            "device_type": dtype,
            "current_temperature": temp,
            "current_humidity": hum,
            "battery": bat,
            "last_updated": iso(now + timedelta(seconds=lu_offset)) if lu_offset is not None else None,
            "readings": readings,
        }

    M = 60
    H = 3600
    D = 86400
    return {"devices": [
        dev("SEED-D1", "Bedroom Meter", "MeterPlus", 22.3, 80, 20, -5 * M, [
            (-30 * M, 22.3, 80, 20), (-2 * H, 22.0, 79, 20), (-3 * D, 21.5, 78, 21),
            (-10 * D, 20.9, 75, 22), (-100 * D, 18.2, 70, 25)]),
        dev("SEED-D2", "外", "Meter", 12.5, 55, 90, -10 * M, [
            (-45 * M, 12.5, 55, 90), (-20 * H, 10.1, 60, 90), (-6 * D, 8.4, 65, 91)]),
        dev("SEED-D3", "Study Hub", "Hub 3", 23.2, 75, None, -2 * M, [
            (-15 * M, 23.2, 75, None)]),
        dev("SEED-D4", "アワコ", "Meter", 19.0, 60, 5, -8 * D, [
            (-8 * D, 19.0, 60, 5)]),
        dev("SEED-D5", "ネズミ", "Meter", None, None, None, None, []),
        dev("SEED-D6", "Tag <b>&</b>", "Meter Pro CO2", 25.0, 40, 100, -1 * M, [
            (-1 * M, 25.0, 40, 100)]),
    ]}


def build_import_extra(now):
    M = 60
    return {"devices": [{
        "device_id": "SEED-D7",
        "device_name": "バロン",
        "device_type": "Meter",
        "current_temperature": 26.4,
        "current_humidity": 50,
        "battery": 77,
        "last_updated": iso(now - timedelta(minutes=3)),
        "readings": [
            {"timestamp": iso(now - timedelta(minutes=3)), "temperature": 26.4, "humidity": 50, "battery": 77},
            {"timestamp": iso(now - timedelta(minutes=90)), "temperature": 26.0, "humidity": 52, "battery": 77},
        ],
    }]}


LATENCY_ROWS = [
    (-3600, "/devices", None, 120.5, 200, 1, None),
    (-3000, "/devices/SEED-D1/status", "SEED-D1", 80.0, 200, 1, None),
    (-2400, "/devices/SEED-D2/status", "SEED-D2", 50.0, 429, 0, "Rate limited. Backing off for 120 seconds"),
    (-1800, "/devices/SEED-D3/status", "SEED-D3", 300.0, 500, 0, "Request error: timeout"),
]


def post_import(base_url, payload):
    req = urllib.request.Request(
        base_url.rstrip("/") + "/api/import",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def insert_latency(db_path, now):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("DELETE FROM latency_logs")
        for off, endpoint, device_id, lat, code, succ, err in LATENCY_ROWS:
            conn.execute(
                "INSERT INTO latency_logs (endpoint, device_id, timestamp, latency_ms, status_code, success, error_message)"
                " VALUES (?, ?, ?, ?, ?, ?, ?)",
                (endpoint, device_id, iso(now + timedelta(seconds=off)), lat, code, succ, err),
            )
        conn.commit()
    finally:
        conn.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://localhost:8000")
    ap.add_argument("--db-path")
    ap.add_argument("--write-import-extra", metavar="PATH",
                    help="Write import_extra.json (SEED-D7) to PATH and exit")
    args = ap.parse_args()

    now = now_utc()

    if args.write_import_extra:
        with open(args.write_import_extra, "w") as f:
            json.dump(build_import_extra(now), f, ensure_ascii=False, indent=2)
        print(f"wrote {args.write_import_extra}")
        return

    if not args.db_path:
        ap.error("--db-path is required when seeding")

    result = post_import(args.base_url, build_base(now))
    print(f"import: {result}")
    insert_latency(args.db_path, now)
    print(f"latency_logs: {len(LATENCY_ROWS)} rows inserted into {args.db_path}")


if __name__ == "__main__":
    main()
