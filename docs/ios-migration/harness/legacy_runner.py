#!/usr/bin/env python3
"""Measure legacy-web and legacy-api behaviour from docs/ios-migration/cases.json."""
import argparse
import json
import os
import re
import signal
import sqlite3
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from socketserver import ThreadingMixIn
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
DEFAULT_INDEX = REPO / "switchbot-dashboard/switchbot-frontend/index.html"
DEFAULT_CASES = HERE.parent / "cases.json"
DEFAULT_RESULTS = HERE.parent / "results"
FRONTEND_PORT = 8899
BACKUP_ROUTE_DELAY_SECONDS = 1.25
STALE_SECONDS = 7 * 24 * 60 * 60


def api_request(url, method="GET", payload=None, timeout=30):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"} if data is not None else {},
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, {key.lower(): value for key, value in resp.headers.items()}, resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, {key.lower(): value for key, value in exc.headers.items()}, exc.read()


def api_get_json(url, timeout=30):
    status, headers, body = api_request(url, timeout=timeout)
    return status, headers, json.loads(body)


def api_post_json(url, payload=None, timeout=120):
    status, headers, body = api_request(url, "POST", payload, timeout)
    try:
        return status, headers, json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return status, headers, None


def rebase_import_timestamps(payload):
    timestamps = []
    for device in payload.get("devices", []):
        values = [device.get("last_updated")]
        values.extend(reading.get("timestamp") for reading in device.get("readings", []))
        for value in values:
            if value:
                parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                timestamps.append(parsed.astimezone(timezone.utc))
    if not timestamps:
        return payload

    shift = datetime.now(timezone.utc) - timedelta(minutes=3) - max(timestamps)

    def shifted(value):
        if not value:
            return value
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return (parsed.astimezone(timezone.utc) + shift).isoformat()

    for device in payload.get("devices", []):
        if "last_updated" in device:
            device["last_updated"] = shifted(device["last_updated"])
        for reading in device.get("readings", []):
            if "timestamp" in reading:
                reading["timestamp"] = shifted(reading["timestamp"])
    return payload


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class FrontendProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?", 1)[0] in ("/", "/index.html"):
            self._send_html(self.server.index_html)
        elif self.path.split("?", 1)[0] == "/prod.html":
            self._send_html(self.server.original_html)
        elif self.path.split("?", 1)[0].startswith("/api/"):
            self._proxy_request()
        else:
            self.send_error(404)

    def do_POST(self):
        self._proxy_request()

    def _send_html(self, content):
        body = content.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _proxy_request(self):
        upstream = self.server.upstream_base.rstrip("/") + self.path
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else None
        headers = {
            key: value
            for key, value in self.headers.items()
            if key.lower() not in {"host", "connection", "content-length"}
        }
        request = urllib.request.Request(upstream, data=body, headers=headers, method=self.command)
        try:
            response = urllib.request.urlopen(request, timeout=180)
        except urllib.error.HTTPError as exc:
            response = exc
        except Exception as exc:
            error_body = json.dumps({"detail": str(exc)}).encode()
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(error_body)))
            self.end_headers()
            self.wfile.write(error_body)
            return

        response_body = response.read()
        self.send_response(response.code)
        for key, value in response.headers.items():
            if key.lower() not in {
                "connection",
                "content-length",
                "transfer-encoding",
                "content-encoding",
                "date",
                "server",
            }:
                self.send_header(key, value)
        self.send_header("Content-Length", str(len(response_body)))
        self.end_headers()
        self.wfile.write(response_body)

    def log_message(self, fmt, *args):
        return


def serve_frontend(original_html, patched_html, port):
    server = ThreadedHTTPServer(("127.0.0.1", port), FrontendProxyHandler)
    server.original_html = original_html
    server.index_html = patched_html
    server.upstream_base = "http://127.0.0.1:8000"
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def start_instance(port, db_path, with_creds=False, no_seed=False):
    args = ["bash", str(HERE / "reset_and_seed.sh"), str(port), str(db_path)]
    if no_seed:
        args.append("--no-seed")
    if with_creds:
        args.append("--with-creds")
    return subprocess.run(args, check=True, capture_output=True, text=True)


def stop_port(port):
    def port_pids():
        try:
            result = subprocess.run(
                ["lsof", "-ti", f"tcp:{port}"],
                capture_output=True,
                text=True,
                check=False,
            )
        except FileNotFoundError as exc:
            raise RuntimeError("lsof is required to stop a backend safely") from exc
        if result.returncode not in (0, 1):
            raise RuntimeError(f"Could not inspect processes using port {port}")
        return result.stdout.split()

    def validate_backend_pids(pids):
        for pid in pids:
            result = subprocess.run(
                ["ps", "-o", "args=", "-p", pid],
                capture_output=True,
                text=True,
                check=False,
            )
            command = result.stdout
            is_uvicorn_backend = "uvicorn" in command and "app.main" in command
            is_fastapi_backend = "fastapi" in command and "app/main.py" in command
            if result.returncode != 0 or not command or not (
                is_uvicorn_backend or is_fastapi_backend
            ):
                raise RuntimeError(
                    f"Refusing to stop PID {pid} on port {port}: "
                    "it is not a recognized FastAPI backend"
                )

    pids = port_pids()
    validate_backend_pids(pids)
    for pid in pids:
        try:
            os.kill(int(pid), signal.SIGTERM)
        except (ProcessLookupError, ValueError):
            pass

    deadline = time.time() + 8
    while time.time() < deadline:
        remaining = port_pids()
        validate_backend_pids(remaining)
        if not remaining:
            return
        time.sleep(0.2)

    remaining = port_pids()
    validate_backend_pids(remaining)
    for pid in remaining:
        try:
            os.kill(int(pid), signal.SIGKILL)
        except (ProcessLookupError, ValueError):
            pass


def wait_dashboard(page):
    page.wait_for_selector("#status-bar", state="visible", timeout=30000)
    page.wait_for_function(
        "document.querySelector('#status-meters-count').textContent.includes('Monitoring')",
        timeout=30000,
    )


def compare_key(key, expected, actual):
    if key == "label_regex" and isinstance(expected, dict):
        errors = []
        for scale, pattern in expected.items():
            labels = (actual or {}).get(scale, [])
            if not labels:
                errors.append(f"{scale}: no labels")
            for label in labels:
                if not re.match(pattern, str(label)):
                    errors.append(f"{scale}: {label!r} does not match {pattern!r}")
        return ("FAIL", "; ".join(errors)) if errors else ("PASS", None)
    if key.endswith("_regex") and isinstance(expected, str):
        if actual is not None and re.match(expected, str(actual)):
            return "PASS", None
        return "FAIL", f"does not match {expected!r}"
    if isinstance(expected, str) and ("{" in expected or "実測" in expected):
        return "RECORDED", "Expected value is a template/reference, retained for cross-target comparison."
    if actual == expected:
        return "PASS", None
    return "FAIL", f"expected {expected!r}, measured {actual!r}"


def write_summary(results, cases, path):
    rows = [
        "| Case | Name | Result | Notes |",
        "|---|---|---|---|",
    ]
    for case in cases:
        result = results.get(case["id"])
        if result is None:
            continue
        notes = "; ".join(result["notes"]).replace("|", "\\|") or "—"
        rows.append(
            f"| {case['id']} | {case['name']} | {result['overall']} | {notes} |"
        )
    path.write_text("\n".join(rows) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--index", default=str(DEFAULT_INDEX))
    parser.add_argument("--cases", default=str(DEFAULT_CASES))
    parser.add_argument("--results", default=str(DEFAULT_RESULTS))
    parser.add_argument("--import-extra", default=str(DEFAULT_RESULTS / "import_extra.json"))
    parser.add_argument("--skip-tc18", action="store_true")
    args = parser.parse_args()

    results_dir = Path(args.results)
    screens_dir = results_dir / "legacy_screens"
    screens_dir.mkdir(parents=True, exist_ok=True)
    case_list = json.loads(Path(args.cases).read_text())["cases"]
    all_cases = {case["id"]: case for case in case_list}
    web_cases = {
        case["id"]: case for case in case_list if "legacy-web" in case.get("targets", [])
    }
    expected_web_ids = [case["id"] for case in case_list if "legacy-web" in case.get("targets", [])]

    source_html = Path(args.index).read_text()
    api_url = f"http://127.0.0.1:{FRONTEND_PORT}"
    patched_html, substitutions = re.subn(
        r"var API_URL = '[^']+';",
        f"var API_URL = '{api_url}';",
        source_html,
        count=1,
    )
    if substitutions != 1:
        raise RuntimeError("Could not set API_URL in the served legacy index.html")

    instances = results_dir / "instances"
    instance_dbs = {
        8000: instances / "8000" / "app.db",
        8001: instances / "8001" / "app.db",
        8002: instances / "8002" / "app.db",
    }
    server = None
    results = {}

    def record(
        case_id,
        actual,
        page=None,
        notes=None,
        expected_overrides=None,
        additional_expectations=None,
    ):
        case = all_cases[case_id]
        expected = dict(case["expected"])
        expected.update(expected_overrides or {})
        expected.update(additional_expectations or {})
        key_results = {}
        note_list = list(notes or [])
        for key, expected_value in expected.items():
            status, detail = compare_key(key, expected_value, actual.get(key))
            key_results[key] = {
                "result": status,
                "expected": expected_value,
                "actual": actual.get(key),
            }
            if detail:
                note_list.append(f"{key}: {detail}")
        overall = "FAIL" if any(item["result"] == "FAIL" for item in key_results.values()) else "PASS"
        screenshot = None
        if page is not None:
            screenshot_path = screens_dir / f"{case_id}.png"
            page.screenshot(path=str(screenshot_path), full_page=True)
            screenshot = str(screenshot_path.relative_to(results_dir))
        item = {
            "id": case_id,
            "name": case["name"],
            "expected": expected,
            "actual": actual,
            "key_results": key_results,
            "overall": overall,
            "pass": overall == "PASS",
            "notes": note_list,
        }
        if screenshot:
            item["screenshot"] = screenshot
        results[case_id] = item
        print(f"{case_id}: {overall}")
        return item

    try:
        print("Starting seeded legacy backends on ports 8000 and 8002.")
        start_instance(8000, instance_dbs[8000])
        start_instance(8002, instance_dbs[8002])
        server = serve_frontend(source_html, patched_html, FRONTEND_PORT)

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1280, "height": 1600}, accept_downloads=True)
            page = context.new_page()
            page.goto(f"{api_url}/index.html")
            wait_dashboard(page)

            panel_js = """() => {
              const panels = [];
              document.querySelectorAll('#meters-container .panel').forEach(p => {
                const title = p.querySelector(':scope > .panel-heading .meter-panel-title strong');
                if (!title) return;
                panels.push({
                  name: title.textContent.trim(),
                  device_type: (p.querySelector('.device-type-tag') || {}).textContent || null,
                  labels: [...p.querySelectorAll('.meter-stats .label')].map(e => e.textContent.trim()),
                  last_updated: (p.querySelector('.meter-last-updated') || {}).textContent || null,
                  stale_empty: [...p.querySelectorAll('.stale-meter-empty')].map(e => e.textContent.trim()),
                  badge: (p.querySelector('.stale-meter-badge') || {}).textContent || null,
                  has_chart: !!p.querySelector('canvas'),
                  stale: p.closest('.stale-meters-panel') !== null,
                });
              });
              return panels;
            }"""
            panels = page.evaluate(panel_js)
            by_name = {panel["name"]: panel for panel in panels}

            record("TC-01", {
                "title": page.title(),
                "connection": page.inner_text("#connection-status").strip(),
                "status_text": page.inner_text("#status-meters-count").strip(),
                "last_refresh_regex": page.inner_text("#status-last-refresh").strip(),
                "rate_limit_warning_visible": page.is_visible("#rate-limit-warning"),
                "error_visible": page.is_visible("#error"),
            }, page)

            for case_id, name in [
                ("TC-02", "第1蒸留塔 (T-101)"),
                ("TC-03", "制御盤 (CP-1601)"),
                ("TC-04", "Tag <b>&</b>"),
            ]:
                panel = by_name.get(name, {})
                actual = {
                    "display_name": panel.get("name"),
                    "device_type": panel.get("device_type"),
                    "labels": panel.get("labels"),
                }
                if case_id == "TC-02":
                    actual["last_updated_prefix"] = (panel.get("last_updated") or "")[
                        : len("Last updated: ")
                    ]
                    actual["has_chart"] = panel.get("has_chart")
                if case_id == "TC-03":
                    actual["has_chart"] = panel.get("has_chart")
                record(case_id, actual, page)

            stale_panels = [panel for panel in panels if panel["stale"]]
            active_panels = [panel for panel in panels if not panel["stale"]]
            record("TC-05", {
                "section_title": page.evaluate(
                    "document.querySelector('.meter-section-title')?.textContent.trim()"
                ),
                "section_subtitle": page.evaluate(
                    "document.querySelector('.meter-section-subtitle')?.textContent.trim()"
                ),
                "stale_display_names": [panel["name"] for panel in stale_panels],
                "badge": (stale_panels[0].get("badge") or "").strip() if stale_panels else None,
                "no_history_text": next(
                    (text for panel in stale_panels for text in panel["stale_empty"] if "履歴" in text),
                    None,
                ),
                "active_count": len(active_panels),
            }, page)

            for case_id, name in [
                ("TC-06", "コンプレッサー (C-601)"),
                ("TC-07", "冷却塔 (CT-401)"),
            ]:
                panel = by_name.get(name, {})
                actual = {"display_name": panel.get("name"), "labels": panel.get("labels")}
                if case_id == "TC-06":
                    actual["no_value_text"] = next(
                        (text for text in panel.get("stale_empty", []) if "値がありません" in text),
                        None,
                    )
                actual["has_last_updated"] = panel.get("last_updated") is not None
                actual["has_chart"] = panel.get("has_chart")
                record(case_id, actual, page)

            record("TC-08", {
                "options": page.eval_on_selector_all(
                    "#time-scale-select option", "els => els.map(e => e.textContent.trim())"
                ),
                "default": page.eval_on_selector(
                    "#time-scale-select option:checked", "e => e.textContent.trim()"
                ),
            }, page)

            points = {}
            labels = {}
            for scale in ("hour", "day", "week", "month", "year"):
                with page.expect_response(
                    lambda response: (
                        "/api/meters/SEED-D1/history" in response.url
                        and f"time_scale={scale}" in response.url
                    ),
                    timeout=15000,
                ) as history_response:
                    page.select_option("#time-scale-select", scale)
                history = history_response.value.json().get("history", [])
                page.wait_for_function(
                    """expectedCount => {
                      const chart = window.charts && window.charts['SEED-D1'];
                      return chart && chart.data.labels.length === expectedCount;
                    }""",
                    arg=len(history),
                    timeout=15000,
                )
                current_labels = page.evaluate("window.charts['SEED-D1'].data.labels")
                points[scale] = len(current_labels)
                labels[scale] = current_labels
            page.select_option("#time-scale-select", "day")
            record("TC-09", {"points": points, "label_regex": labels}, page)

            _, _, health = api_get_json("http://127.0.0.1:8000/healthz")
            _, _, status = api_get_json("http://127.0.0.1:8000/api/status")
            record("TC-17", {
                "healthz": health.get("status"),
                "configured": status.get("configured"),
                "meters_count": status.get("meters_count"),
                "is_rate_limited": status.get("is_rate_limited"),
                "collection_interval": status.get("collection_interval"),
            })

            page.evaluate("""() => {
              window.__backupButtonDuring = null;
              document.querySelector('#btn-backup').addEventListener('click', () => {
                setTimeout(() => {
                  window.__backupButtonDuring =
                    document.querySelector('#btn-backup').textContent.trim();
                }, 100);
              }, true);
            }""")
            page.route(
                "**/api/backup",
                lambda route: (time.sleep(BACKUP_ROUTE_DELAY_SECONDS), route.continue_()),
            )
            with page.expect_download(timeout=30000) as download_event, page.expect_response(
                lambda response: urlsplit(response.url).path == "/api/backup",
                timeout=30000,
            ) as response_event:
                page.locator("#btn-backup").click(no_wait_after=True)
            backup_download = download_event.value
            backup_response = response_event.value
            page.unroute("**/api/backup")
            page.wait_for_function(
                "document.querySelector('#btn-backup').textContent.trim() === 'Download Backup'",
                timeout=15000,
            )
            backup_path = Path(backup_download.path())
            filename_header = backup_response.headers.get("content-disposition", "")
            filename_match = re.search(r'filename="?([^";]+)', filename_header)
            try:
                with backup_path.open("rb") as backup_file:
                    sqlite_header = backup_file.read(16) == b"SQLite format 3\x00"
                with sqlite3.connect(f"file:{backup_path}?mode=ro", uri=True) as backup_db:
                    device_count = backup_db.execute("SELECT COUNT(*) FROM devices").fetchone()[0]
            except (OSError, sqlite3.Error):
                sqlite_header = False
                device_count = None
            record("TC-13", {
                "button_during": page.evaluate("window.__backupButtonDuring"),
                "final_button": page.inner_text("#btn-backup").strip(),
                "http_status": backup_response.status,
                "filename_regex": filename_match.group(1) if filename_match else None,
                "sqlite_header": sqlite_header,
                "contains_seed_devices": device_count,
                "error_visible": page.is_visible("#error"),
            }, page)

            _, _, stats = api_get_json("http://127.0.0.1:8000/api/latency-stats")
            record("TC-14", {
                key: stats.get(key)
                for key in (
                    "total_calls",
                    "avg_latency_ms",
                    "min_latency_ms",
                    "max_latency_ms",
                    "successful_calls",
                    "failed_calls",
                    "success_rate",
                )
            })

            _, _, all_logs = api_get_json("http://127.0.0.1:8000/api/latency-logs")
            _, _, endpoint_logs = api_get_json(
                "http://127.0.0.1:8000/api/latency-logs?endpoint=/devices"
            )
            _, _, device_logs = api_get_json(
                "http://127.0.0.1:8000/api/latency-logs?device_id=SEED-D1"
            )
            _, _, limited_logs = api_get_json(
                "http://127.0.0.1:8000/api/latency-logs?limit=2"
            )
            record("TC-15", {
                "order_endpoints": [entry["endpoint"] for entry in all_logs["logs"]],
                "filter_endpoint_count": endpoint_logs["count"],
                "filter_device_count": device_logs["count"],
                "limit2_count": limited_logs["count"],
            })

            before_refresh = page.inner_text("#status-last-refresh").strip()
            time.sleep(35)
            after_refresh = page.inner_text("#status-last-refresh").strip()
            record("TC-19", {
                "last_refresh_changed": before_refresh != after_refresh,
                "before": before_refresh,
                "after": after_refresh,
            }, page)

            page.evaluate("""() => {
              window.__refreshButtonDuring = null;
              document.querySelector('#btn-refresh').addEventListener('click', () => {
                setTimeout(() => {
                  window.__refreshButtonDuring =
                    document.querySelector('#btn-refresh').textContent.trim();
                }, 100);
              }, true);
            }""")
            page.route(
                "**/api/meters/refresh",
                lambda route: (time.sleep(0.4), route.continue_()),
            )
            with page.expect_response(
                lambda response: urlsplit(response.url).path == "/api/meters/refresh",
                timeout=30000,
            ) as refresh_response:
                page.locator("#btn-refresh").click(no_wait_after=True)
            refresh_status = refresh_response.value.status
            page.unroute("**/api/meters/refresh")
            page.wait_for_function(
                "document.querySelector('#btn-refresh').textContent.trim() === 'Refresh Data'",
                timeout=15000,
            )
            page.wait_for_timeout(1000)
            record("TC-10", {
                "refresh_http_status": refresh_status,
                "button_during": page.evaluate("window.__refreshButtonDuring"),
                "final_button": page.inner_text("#btn-refresh").strip(),
                "final_connection": page.inner_text("#connection-status").strip(),
                "final_error_visible": page.is_visible("#error"),
            }, page)

            with Path(args.import_extra).open(encoding="utf-8") as extra_file:
                extra_payload = rebase_import_timestamps(json.load(extra_file))
            _, _, imported = api_post_json(
                "http://127.0.0.1:8000/api/import", extra_payload
            )
            page.reload()
            wait_dashboard(page)
            panels = page.evaluate(panel_js)
            seed_d7_panel = next(
                (panel for panel in panels if panel["name"] == "遠心分離機 (S-701)"),
                None,
            )
            seed_d7_is_stale = (
                seed_d7_panel.get("stale") if seed_d7_panel is not None else None
            )
            record("TC-16", {
                "imported_devices": imported.get("imported_devices") if imported else None,
                "imported_readings": imported.get("imported_readings") if imported else None,
                "new_display_name": "遠心分離機 (S-701)"
                if seed_d7_panel is not None
                else None,
                "status_text": page.inner_text("#status-meters-count").strip(),
                "seed_d7_is_stale": seed_d7_is_stale,
            }, page, notes=[
                f"SEED-D7 stale-side membership: {seed_d7_is_stale}."
            ], additional_expectations={"seed_d7_is_stale": False})

            stop_port(8000)
            page.locator("#btn-refresh").click(no_wait_after=True)
            page.wait_for_selector("#error", state="visible", timeout=15000)
            record("TC-11", {
                "connection": page.inner_text("#connection-status").strip(),
                "error_prefix": page.inner_text("#error-text").strip()[: len("Failed to ")],
            }, page)
            start_instance(8000, instance_dbs[8000])
            page.goto(f"{api_url}/index.html")
            wait_dashboard(page)

            if not args.skip_tc18:
                try:
                    start_instance(8001, instance_dbs[8001], with_creds=True, no_seed=True)
                    refresh_status, _, _ = api_post_json(
                        "http://127.0.0.1:8001/api/meters/refresh", timeout=180
                    )
                    _, _, meters_response = api_get_json("http://127.0.0.1:8001/api/meters")
                    meters = meters_response.get("meters", [])
                    now = datetime.now().astimezone()

                    def is_active(meter):
                        value = meter.get("last_updated")
                        if not value:
                            return False
                        try:
                            updated = datetime.fromisoformat(value.replace("Z", "+00:00"))
                            if updated.tzinfo is None:
                                updated = updated.astimezone()
                            return (now - updated).total_seconds() < STALE_SECONDS
                        except (TypeError, ValueError):
                            return False

                    active_meters = [meter for meter in meters if is_active(meter)]
                    record("TC-18", {
                        "meter_device_ids": sorted(
                            meter["device_id"] for meter in meters if meter.get("device_id")
                        ),
                        "all_active_have_temperature": all(
                            meter.get("current_temperature") is not None for meter in active_meters
                        ) if active_meters else None,
                    }, notes=[
                        f"Refresh HTTP status: {refresh_status}.",
                        "The measured device IDs are the legacy reference set for TC-18 comparison.",
                    ])
                except Exception as exc:
                    record("TC-18", {
                        "meter_device_ids": None,
                        "all_active_have_temperature": None,
                    }, notes=[
                        f"Could not complete live SwitchBot measurement ({type(exc).__name__})."
                    ])
                finally:
                    stop_port(8001)

            server.upstream_base = "https://snakeroom.fly.dev"
            try:
                page.goto(f"{api_url}/prod.html")
                wait_dashboard(page)
                _, _, production_status = api_get_json("https://snakeroom.fly.dev/api/status")
                expected_status_text = (
                    f"Monitoring {production_status['meters_count']} meters"
                )
                record("TC-20", {
                    "status_text": page.inner_text("#status-meters-count").strip(),
                    "connection": page.inner_text("#connection-status").strip(),
                }, page, notes=[
                    f"Read-only production API meters_count: {production_status['meters_count']}."
                ], expected_overrides={"status_text": expected_status_text})
            except Exception as exc:
                record("TC-20", {
                    "status_text": None,
                    "connection": None,
                }, notes=[
                    f"Read-only production measurement could not complete ({type(exc).__name__})."
                ])

            server.upstream_base = "http://127.0.0.1:8002"
            try:
                page.goto(f"{api_url}/index.html")
                wait_dashboard(page)
                with page.expect_response(
                    lambda response: urlsplit(response.url).path == "/api/backup",
                    timeout=30000,
                ) as backup_error_response:
                    page.locator("#btn-backup").click(no_wait_after=True)
                failed_response = backup_error_response.value
                try:
                    error_body = failed_response.json()
                except Exception:
                    error_body = {}
                page.wait_for_selector("#error", state="visible", timeout=15000)
                page.wait_for_function(
                    "document.querySelector('#btn-backup').textContent.trim() === 'Download Backup'",
                    timeout=15000,
                )
                body_request_id = error_body.get("request_id")
                error_text = page.inner_text("#error-text").strip()
                record("TC-22", {
                    "http_status": failed_response.status,
                    "body_request_id_regex": body_request_id,
                    "x_request_id_matches_body": (
                        failed_response.headers.get("x-request-id") == body_request_id
                    ),
                    "error_regex": error_text,
                    "connection": page.inner_text("#connection-status").strip(),
                    "final_button": page.inner_text("#btn-backup").strip(),
                }, page)
            except Exception as exc:
                record("TC-22", {
                    "http_status": None,
                    "body_request_id_regex": None,
                    "x_request_id_matches_body": None,
                    "error_regex": None,
                    "connection": None,
                    "final_button": None,
                }, notes=[f"Backup failure measurement could not complete ({type(exc).__name__})."])

            # TC-23 has no web surface, but use the same results schema.
            backend_dir = REPO / "switchbot-dashboard" / "switchbot-backend"
            clean_env = os.environ.copy()
            clean_env.pop("SWITCHBOT_TOKEN", None)
            clean_env.pop("SWITCHBOT_SECRET", None)
            targeted = subprocess.run(
                ["poetry", "run", "pytest", "tests/test_error_alerts.py", "-v"],
                cwd=backend_dir,
                env=clean_env,
                capture_output=True,
                text=True,
            )
            targeted_status = (
                "all passed"
                if targeted.returncode == 0
                else f"failed (exit {targeted.returncode})"
            )
            record("TC-23", {
                "pytest_test_error_alerts": targeted_status,
            }, notes=[
                f"Focused error-alert pytest exit code: {targeted.returncode}."
            ])

            full_suite = subprocess.run(
                ["poetry", "run", "pytest", "-v"],
                cwd=backend_dir,
                env=clean_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            suite_log = results_dir / "phase1_pytest.log"
            suite_log.write_text(full_suite.stdout, encoding="utf-8")
            print(
                f"Full backend pytest: exit={full_suite.returncode}; log={suite_log}"
            )
            if full_suite.returncode != 0:
                results["TC-23"]["notes"].append(
                    f"Full backend suite failed with exit code {full_suite.returncode}; see phase1_pytest.log."
                )
                results["TC-23"]["overall"] = "FAIL"
                results["TC-23"]["pass"] = False
                results["TC-23"]["actual"]["full_backend_suite"] = (
                    f"failed (exit {full_suite.returncode})"
                )
                results["TC-23"]["key_results"]["full_backend_suite"] = {
                    "result": "FAIL",
                    "expected": "all passed",
                    "actual": f"failed (exit {full_suite.returncode})",
                }
            else:
                results["TC-23"]["actual"]["full_backend_suite"] = "all passed"
                results["TC-23"]["key_results"]["full_backend_suite"] = {
                    "result": "PASS",
                    "expected": "all passed",
                    "actual": "all passed",
                }
                results["TC-23"]["notes"].append(
                    "Full backend suite passed; see phase1_pytest.log."
                )
            browser.close()
    finally:
        if server is not None:
            server.shutdown()
            server.server_close()
        for port in (8000, 8001, 8002):
            stop_port(port)
        if results:
            output_path = results_dir / "legacy.json"
            output_path.write_text(
                json.dumps(results, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            print(f"Wrote {output_path}")

    missing = [case_id for case_id in expected_web_ids if case_id not in results]
    if missing:
        raise RuntimeError(f"Legacy measurement did not produce results for: {missing}")
    write_summary(results, case_list, results_dir / "legacy_summary.md")
    print(f"Wrote {results_dir / 'legacy_summary.md'}")


if __name__ == "__main__":
    main()
