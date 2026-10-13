#!/usr/bin/env python3
"""Local-only UI evidence receiver and transparent legacy API proxy.

Expected values are read from the frozen spec commit, never rewritten.
SWITCHBOT credentials never enter this process's result payloads.
"""
import argparse
import base64
import importlib.util
import json
import os
from pathlib import Path
import re
import signal
import sqlite3
import subprocess
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
SPEC_REF = "origin/devin/1791863403-ios-migration-spec"
CASES = json.loads(subprocess.check_output(
    ["git", "show", f"{SPEC_REF}:docs/ios-migration/cases.json"], cwd=REPO))
CASE_MAP = {c["id"]: c for c in CASES["cases"]}
RESULTS = ROOT / "e2e-results"
LOCK = threading.Lock()
TRACE = []
UPSTREAM = "http://127.0.0.1:8000"
SCRATCH = Path(os.environ.get("E2E_SCRATCH", Path.home() / "ios-artifacts/spec-scratch"))
HARNESS = SCRATCH / "docs/ios-migration/harness"
SIM = os.environ.get("E2E_SIMULATOR", "E0224A22-F874-4B8C-83FB-EB084492C493")


def api(url, method="GET", body=None):
    req = urllib.request.Request(url, data=body, method=method,
                                 headers={"Content-Type": "application/json"} if body else {})
    try:
        response = urllib.request.urlopen(req, timeout=180)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, dict(response.headers), response.read()


def initialize():
    RESULTS.mkdir(exist_ok=True)
    (RESULTS / "ios_screens").mkdir(exist_ok=True)
    output = {}
    for case in CASES["cases"]:
        cid = case["id"]
        target = ("ios-mock" if cid in ["TC-12", "TC-21"] else
                  "ios-standalone" if cid in ["TC-18", "TC-24"] else "ios-remote")
        output[cid] = dict(id=cid, name=case["name"], target=target,
                           expected=case["expected"], actual={}, key_results={},
                           overall="N/A" if cid == "TC-23" else "NOT_RUN",
                           notes=["N/A (V-06: Slack はサーバー側)"] if cid == "TC-23" else ["未実行"],
                           screenshot=None)
    save(output)


def save(output):
    (RESULTS / "ios.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    counts = {s: sum(r["overall"] == s for r in output.values())
              for s in ["PASS", "FAIL", "NOT_RUN", "N/A"]}
    rows = ["# Phase 2: iOS E2E 結果", "",
            "Xcode 26.6 (17F113) / iOS 27.0 (24A434) / iPhone 17",
            f"SHA: `{subprocess.check_output(['git','rev-parse','HEAD'], cwd=REPO).decode().strip()}`",
            "", " / ".join(f"{k}: {v}" for k, v in counts.items()), "",
            "| TC | ケース | 結果 | 備考 |", "|---|---|---|---|"]
    for r in output.values():
        note = "; ".join(r["notes"]).replace("|", "\\|")
        rows.append(f'| {r["id"]} | {r["name"]} | {r["overall"]} | {note} |')
    rows += ["", "## 未検証項目と理由"]
    rows += [f'- {r["id"]}: {"; ".join(r["notes"])}'
             for r in output.values() if r["overall"] in ["NOT_RUN", "N/A"]]
    (RESULTS / "ios_summary.md").write_text("\n".join(rows) + "\n")


def compare(key, expected, actual):
    if actual is None:
        return "NOT_RUN"
    if key == "label_regex":
        return "PASS" if all(actual.get(scale) and all(re.match(pattern, s) for s in actual[scale])
                             for scale, pattern in expected.items()) else "FAIL"
    if key.endswith("_regex"):
        return "PASS" if re.match(expected, str(actual)) else "FAIL"
    if key == "meter_device_ids":
        legacy = json.loads(subprocess.check_output(
            ["git", "show", f"{SPEC_REF}:docs/ios-migration/results/legacy.json"], cwd=REPO))
        return "PASS" if sorted(actual) == sorted(legacy["TC-18"]["actual"][key]) else "FAIL"
    if key == "status_text" and "{GET" in str(expected):
        return "PASS" if actual in [
            f"Monitoring {n} meters" for n in PRODUCTION_COUNTS] else "FAIL"
    if key.endswith("_prefix"):
        return "PASS" if str(actual).startswith(expected) else "FAIL"
    return "PASS" if actual == expected else "FAIL"


PRODUCTION_COUNTS = []


def record(payload):
    cid = payload["id"]
    actual = payload["actual"]
    expected = CASE_MAP[cid]["expected"]
    checks = {k: dict(result=compare(k, v, actual.get(k)), expected=v, actual=actual.get(k))
              for k, v in expected.items()}
    overall = ("FAIL" if any(c["result"] == "FAIL" for c in checks.values()) else
               "NOT_RUN" if any(c["result"] == "NOT_RUN" for c in checks.values()) else "PASS")
    with LOCK:
        output = json.loads((RESULTS / "ios.json").read_text())
        r = output[cid]
        r.update(actual=actual, key_results=checks, overall=overall, notes=payload.get("notes", []))
        if "screen" in payload:
            screen = f"ios_screens/{cid}.png"
            (RESULTS / screen).write_bytes(base64.b64decode(payload["screen"]))
            r["screenshot"] = screen
        save(output)
    print(cid, overall, flush=True)
    return {"overall": overall, "key_results": checks}


def backup_info():
    container = Path(subprocess.check_output(
        ["xcrun", "simctl", "get_app_container", SIM, "com.madmerger.TempMaster", "data"]).decode().strip())
    files = sorted(container.rglob("switchbot_backup_*.db"), key=lambda p: p.stat().st_mtime)
    if not files:
        return {}
    file = files[-1]
    with sqlite3.connect(file) as db:
        tables = sorted(row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'"))
        count = db.execute("SELECT COUNT(*) FROM devices").fetchone()[0]
    return {"filename_regex": file.name, "sqlite_header": file.read_bytes().startswith(b"SQLite format 3\0"),
            "contains_seed_devices": count, "tables": tables}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def send_json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        global UPSTREAM
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        if self.path.startswith("/api/"):
            return self.proxy(body)
        payload = json.loads(body or b"{}")
        if self.path == "/record":
            return self.send_json(record(payload))
        if self.path == "/screen":
            name = payload["name"]
            if not re.fullmatch(r"TC-\d{2}_[a-z]+", name):
                raise ValueError("Invalid screenshot name")
            (RESULTS / "ios_screens" / f"{name}.png").write_bytes(base64.b64decode(payload["screen"]))
            return self.send_json({"ok": True})
        if self.path == "/upstream":
            UPSTREAM = payload["url"]
            TRACE.clear()
            return self.send_json({"ok": True})
        if self.path == "/stop-backend":
            pids = subprocess.run(["lsof", "-ti", "tcp:8000", "-sTCP:LISTEN"],
                                  capture_output=True, text=True).stdout.split()
            for pid in pids:
                cmd = subprocess.check_output(["ps", "-o", "args=", "-p", pid]).decode()
                if "uvicorn" not in cmd or "app.main" not in cmd:
                    raise RuntimeError("Refusing to stop non-backend")
                os.kill(int(pid), signal.SIGTERM)
            return self.send_json({"ok": True})
        if self.path == "/reset":
            port = str(payload.get("port", 8000))
            db = SCRATCH / f"docs/ios-migration/results/instances/{port}/app.db"
            subprocess.run(["bash", str(HARNESS / "reset_and_seed.sh"), port, str(db)], check=True)
            return self.send_json({"ok": True})
        if self.path == "/production":
            status, _, data = api("https://snakeroom.fly.dev/api/status")
            count = json.loads(data)["meters_count"]
            PRODUCTION_COUNTS.append(count)
            return self.send_json({"http_status": status, "meters_count": count})
        self.send_error(404)

    def do_GET(self):
        if self.path.startswith("/api/") or self.path == "/healthz":
            return self.proxy()
        if self.path == "/trace":
            return self.send_json(TRACE)
        if self.path == "/backup-info":
            return self.send_json(backup_info())
        if self.path == "/extra":
            spec = importlib.util.spec_from_file_location("seed", HARNESS / "seed_legacy.py")
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return self.send_json(module.build_import_extra(module.now_utc()))
        if self.path == "/health":
            return self.send_json({"ok": True})
        self.send_error(404)

    def proxy(self, body=None):
        # Match legacy measurement's observable in-flight states without stubbing responses.
        if self.path in ["/api/backup", "/api/meters/refresh"]:
            time.sleep(1.25)
        try:
            status, headers, data = api(UPSTREAM + self.path, self.command, body)
        except (OSError, urllib.error.URLError):
            status, headers, data = 502, {}, b'{"detail":"Local backend unavailable"}'
        entry = {"path": self.path, "method": self.command, "status": status,
                 "headers": {k.lower(): v for k, v in headers.items()}}
        if self.path == "/api/backup" and status >= 400:
            entry["body"] = json.loads(data)
        TRACE.append(entry)
        self.send_response(status)
        for k, v in headers.items():
            if k.lower() not in ["content-length", "transfer-encoding", "connection"]:
                self.send_header(k, v)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--initialize", action="store_true")
    args = parser.parse_args()
    if args.initialize or not (RESULTS / "ios.json").exists():
        initialize()
    print("E2E evidence receiver: http://127.0.0.1:8898", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8898), Handler).serve_forever()
