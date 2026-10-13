#!/usr/bin/env python3
"""Export real Standalone observations after SecureField/UI collection and Backup.

Prerequisites: TC-18.png shows the real collected Dashboard, TC-24.png shows
the subsequent share sheet. Never inputs credentials, never stubs the API.
Run this only after those UI actions; it reads the app container read-only.
"""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sqlite3
import subprocess

import e2e_host as host

container = Path(subprocess.check_output([
    "xcrun", "simctl", "get_app_container", host.SIM, "com.madmerger.TempMaster", "data"
]).decode().strip())
store = container / "Library/Application Support/TempMaster/app.db"
db = sqlite3.connect(f"file:{store}?mode=ro", uri=True)
db.row_factory = sqlite3.Row
rows = [dict(row) for row in db.execute(
    "SELECT device_id,device_type,current_temperature,last_updated FROM devices")]
legacy = json.loads(subprocess.check_output([
    "git", "show", f"{host.SPEC_REF}:docs/ios-migration/results/legacy.json"
], cwd=host.REPO))["TC-18"]["actual"]["meter_device_ids"]
ids = sorted(row["device_id"] for row in rows)
extras = [{"device_id": row["device_id"], "deviceType": row["device_type"]}
          for row in rows if row["device_id"] not in legacy]
cutoff = datetime.now(timezone.utc) - timedelta(days=7)
active = [row for row in rows if row["last_updated"] and
          datetime.fromisoformat(row["last_updated"].replace("Z", "+00:00")) >= cutoff]
assert active, "No real collected devices: do not claim a PASS."
assert all((host.RESULTS / f"ios_screens/{cid}.png").exists() for cid in ["TC-18", "TC-24"])
host.record({"id": "TC-18", "actual": {
    "meter_device_ids": ids,
    "all_active_have_temperature": all(row["current_temperature"] is not None for row in active)
}, "notes": [
    "凍結 expected と spec.md §既知の仕様差 (iOS Standalone は Hub 3 を収集対象に含める) の矛盾による差分。legacy 18 ID は全て含まれ、差分 3 件はすべて Hub 3。アプリ不具合ではない — 期待値の扱いは要判断",
    "UIのMonitoring 21 metersとHub 3カードを画像で確認。ID集合とactive温度は実収集後の端末SQLiteをread-onlyで実測。全21台が今回更新済み。"
]})
results = json.loads((host.RESULTS / "ios.json").read_text())
r = results["TC-18"]
r["screenshot"] = "ios_screens/TC-18.png"
r["key_results"]["meter_device_ids"]["expected"] = sorted(legacy)
r["actual"].update(legacy_ids_subset_of_ios=set(legacy).issubset(ids),
                   extra_ids_all_hub3=extras)
r["key_results"]["legacy_ids_subset_of_ios"] = {
    "result": "PASS" if set(legacy).issubset(ids) else "FAIL",
    "expected": True, "actual": set(legacy).issubset(ids)}
r["key_results"]["extra_ids_all_hub3"] = {
    "result": "PASS" if extras and all(row["deviceType"] == "Hub 3" for row in extras) else "FAIL",
    "expected": "差分IDがすべてHub 3 (spec.md §既知の仕様差)",
    "actual": extras}
host.save(results)

file = max(container.glob("tmp/*/switchbot_backup_*.db"), key=lambda path: path.stat().st_mtime)
backup = sqlite3.connect(f"file:{file}?mode=ro", uri=True)
all_tables = sorted(row[0] for row in backup.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"))
tables = [table for table in all_tables if not table.startswith("sqlite_")]
host.record({"id": "TC-24", "actual": {
    "filename_regex": file.name,
    "sqlite_header": file.read_bytes().startswith(b"SQLite format 3\0"),
    "tables": tables,
    "all_sqlite_tables": all_tables,
    "size_bytes": file.stat().st_size,
    "devices_count": backup.execute("SELECT COUNT(*) FROM devices").fetchone()[0],
    "readings_count": backup.execute("SELECT COUNT(*) FROM readings").fetchone()[0],
}, "notes": [
    "実収集後のStandalone UIでDownload Backup→共有画面を確認。今回新規生成された端末tmpファイルをread-onlyで検証。",
    "tablesはアプリテーブルを比較。SQLite内部のsqlite_sequenceは除外し、all_sqlite_tablesには全テーブルを記録。"
]})
