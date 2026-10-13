#!/usr/bin/env python3
"""Measure legacy-web behaviour for docs/ios-migration/cases.json.

Serves a copy of the legacy index.html (API_URL repointed at --base-url) over a
local http server, drives it with Playwright, and for every case whose targets
include "legacy-web" records `actual` values mirroring the `expected` keys, a
pass/fail comparison, and a full-page screenshot.

Outputs: results/legacy.json, results/legacy_screens/TC-*.png

Usage (from docs/ios-migration/harness, with the seeded backend on :8000):
    .venv/bin/python legacy_runner.py
"""
import argparse
import functools
import http.server
import json
import os
import re
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request
import urllib.error
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
DEFAULT_INDEX = REPO / "switchbot-dashboard/switchbot-frontend/index.html"
DEFAULT_CASES = HERE.parent / "cases.json"
DEFAULT_RESULTS = HERE.parent / "results"
FRONTEND_PORT = 8899
CREDS_PORT = 8001
STALE_MS = 7 * 24 * 60 * 60 * 1000


def api_get(url, timeout=30):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, {k.lower(): v for k, v in resp.headers.items()}, resp.read()


def api_get_json(url, timeout=30):
    status, headers, body = api_get(url, timeout)
    return status, json.loads(body)


def api_post_json(url, payload=None, timeout=120):
    data = json.dumps(payload).encode() if payload is not None else b""
    req = urllib.request.Request(url, data=data,
                                 headers={"Content-Type": "application/json"},
                                 method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, None


def kill_port(port):
    try:
        out = subprocess.run(["lsof", "-ti", f"tcp:{port}"],
                             capture_output=True, text=True).stdout.split()
        for pid in out:
            subprocess.run(["kill", "-9", pid], capture_output=True)
        time.sleep(0.5)
    except Exception as e:
        print(f"kill_port({port}) warning: {e}", file=sys.stderr)


def serve_dir(path, port):
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(path))
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


PANEL_JS = """
() => {
  const panels = [];
  document.querySelectorAll('#meters-container .panel').forEach(p => {
    const title = p.querySelector(':scope > .panel-heading .meter-panel-title strong');
    if (!title) return;
    panels.push({
      name: title.textContent.trim(),
      device_type: (p.querySelector('.device-type-tag')||{}).textContent || null,
      labels: [...p.querySelectorAll('.meter-stats .label')].map(e => e.textContent.trim()),
      last_updated: (p.querySelector('.meter-last-updated')||{}).textContent || null,
      stale_empty: [...p.querySelectorAll('.stale-meter-empty')].map(e => e.textContent.trim()),
      badge: (p.querySelector('.stale-meter-badge')||{}).textContent || null,
      has_chart: !!p.querySelector('canvas'),
      stale: p.closest('.stale-meters-panel') !== null,
    });
  });
  return panels;
}
"""


def wait_dashboard(page):
    page.wait_for_selector('#status-bar', state='visible', timeout=15000)
    page.wait_for_function(
        "document.querySelector('#status-meters-count').textContent.includes('Monitoring')")


def compare(expected, actual):
    """Per-key comparison. Returns (pass, mismatches). Regex keys / template
    strings ('{...}') are record-only."""
    if not isinstance(expected, dict):
        return None, []
    mism = []
    for k, ev in expected.items():
        av = actual.get(k)
        if k.endswith('_regex') and isinstance(ev, str):
            if av is None or not re.match(ev, str(av)):
                mism.append((k, ev, av))
        elif k == 'label_regex' and isinstance(ev, dict):
            for sk, sv in ev.items():
                for lab in (av or {}).get(sk, []):
                    if not re.match(sv, str(lab)):
                        mism.append((f'{k}.{sk}', sv, lab))
        elif isinstance(ev, str) and '{' in ev:
            continue  # template placeholder -> record only
        elif isinstance(ev, dict):
            if av != ev:
                mism.append((k, ev, av))
        else:
            if av != ev:
                mism.append((k, ev, av))
    return (len(mism) == 0), mism


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base-url', default='http://localhost:8000')
    ap.add_argument('--index', default=str(DEFAULT_INDEX))
    ap.add_argument('--cases', default=str(DEFAULT_CASES))
    ap.add_argument('--results', default=str(DEFAULT_RESULTS))
    ap.add_argument('--import-extra', default=str(DEFAULT_RESULTS / 'import_extra.json'))
    ap.add_argument('--run-tc18', action='store_true', help='hit real SwitchBot API (default: on)')
    ap.add_argument('--skip-tc18', action='store_true')
    args = ap.parse_args()

    base = args.base_url.rstrip('/')
    results_dir = Path(args.results)
    screens = results_dir / 'legacy_screens'
    screens.mkdir(parents=True, exist_ok=True)

    cases = {c['id']: c for c in json.loads(Path(args.cases).read_text())['cases']
             if 'legacy-web' in c.get('targets', [])}

    if not Path(args.import_extra).exists():
        subprocess.run([sys.executable, str(HERE / 'seed_legacy.py'),
                        '--write-import-extra', args.import_extra], check=True)

    # --- serve patched (and unpatched) frontend ---
    src = Path(args.index).read_text()
    patched = src.replace("var API_URL = 'https://snakeroom.fly.dev';",
                          f"var API_URL = '{base}';")
    assert patched != src, 'API_URL substitution failed'
    tmp = Path(tempfile.mkdtemp(prefix='legacy_front_'))
    (tmp / 'index.html').write_text(patched)
    (tmp / 'prod.html').write_text(src)  # unmodified URL -> snakeroom
    httpd = serve_dir(tmp, FRONTEND_PORT)
    page_url = f'http://127.0.0.1:{FRONTEND_PORT}/index.html'
    prod_url = f'http://127.0.0.1:{FRONTEND_PORT}/prod.html'

    out = {}

    def record(cid, actual, shot=True, expected=None):
        exp = cases.get(cid, {}).get('expected', {}) if expected is None else expected
        ok, mism = compare(exp, actual)
        shot_path = None
        if shot and page:
            shot_path = str(screens / f'{cid}.png')
            page.screenshot(path=shot_path, full_page=True)
        out[cid] = {'name': cases.get(cid, {}).get('name'),
                    'expected': exp, 'actual': actual, 'pass': ok}
        if mism:
            out[cid]['mismatches'] = [{'key': k, 'expected': e, 'actual': a} for k, e, a in mism]
        print(f"{cid}: pass={ok} {actual}")
        return ok

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={'width': 1280, 'height': 1600})
        page = ctx.new_page()
        page.goto(page_url)
        wait_dashboard(page)

        panels = page.evaluate(PANEL_JS)
        by_name = {p['name']: p for p in panels}

        # ---- TC-01 -------------------------------------------------------
        record('TC-01', {
            'title': page.title(),
            'connection': page.inner_text('#connection-status').strip(),
            'status_text': page.inner_text('#status-meters-count').strip(),
            'last_refresh_regex': page.inner_text('#status-last-refresh').strip(),
            'rate_limit_warning_visible': page.is_visible('#rate-limit-warning'),
            'error_visible': page.is_visible('#error'),
        })

        # ---- TC-02 / TC-03 / TC-04 --------------------------------------
        for cid, name in [('TC-02', '第1蒸留塔 (T-101)'),
                          ('TC-03', 'Study Hub'),
                          ('TC-04', 'Tag <b>&</b>')]:
            p = by_name.get(name, {})
            actual = {'display_name': p.get('name'), 'device_type': p.get('device_type'),
                      'labels': p.get('labels')}
            if cid == 'TC-02':
                actual['last_updated_prefix'] = (p.get('last_updated') or '')[:len('Last updated: ')]
                actual['has_chart'] = p.get('has_chart')
            if cid == 'TC-03':
                actual['has_chart'] = p.get('has_chart')
            record(cid, actual)

        # ---- TC-05 -------------------------------------------------------
        stale_panels = [p for p in panels if p['stale']]
        active_panels = [p for p in panels if not p['stale']]
        record('TC-05', {
            'section_title': page.evaluate("document.querySelector('.meter-section-title')?.textContent.trim()"),
            'section_subtitle': page.evaluate("document.querySelector('.meter-section-subtitle')?.textContent.trim()"),
            'stale_display_names': [p['name'] for p in stale_panels],
            'badge': (stale_panels[0].get('badge') or '').strip() if stale_panels else None,
            'no_history_text': next((t for p in stale_panels for t in p['stale_empty']
                                     if '履歴' in t), None),
            'active_count': len(active_panels),
        })

        # ---- TC-06 / TC-07 ----------------------------------------------
        for cid, name in [('TC-06', 'コンプレッサー (C-601)'), ('TC-07', '冷却塔 (CT-401)')]:
            p = by_name.get(name, {})
            actual = {'display_name': p.get('name'), 'labels': p.get('labels')}
            if cid == 'TC-06':
                actual['no_value_text'] = next((t for t in p['stale_empty'] if '値がありません' in t), None)
            actual['has_last_updated'] = p.get('last_updated') is not None
            actual['has_chart'] = p.get('has_chart')
            if cid == 'TC-07':
                actual.pop('no_value_text', None)
            record(cid, actual)

        # ---- TC-08 -------------------------------------------------------
        record('TC-08', {
            'options': page.eval_on_selector_all('#time-scale-select option',
                                                 'els => els.map(e => e.textContent.trim())'),
            'default': page.eval_on_selector('#time-scale-select option:checked',
                                             'e => e.textContent.trim()'),
        })

        # ---- TC-09 -------------------------------------------------------
        points, labels_actual = {}, {}
        for scale in ['hour', 'day', 'week', 'month', 'year']:
            page.select_option('#time-scale-select', scale)
            page.wait_for_function("window.charts && window.charts['SEED-D1']", timeout=10000)
            labs = page.evaluate("window.charts['SEED-D1'].data.labels")
            points[scale] = len(labs)
            labels_actual[scale] = labs
        page.select_option('#time-scale-select', 'day')
        record('TC-09', {'points': points, 'label_regex': labels_actual})

        # ---- TC-17 -------------------------------------------------------
        _, hz = api_get_json(f'{base}/healthz')
        _, st = api_get_json(f'{base}/api/status')
        record('TC-17', {
            'healthz': hz.get('status'),
            'configured': st.get('configured'),
            'meters_count': st.get('meters_count'),
            'is_rate_limited': st.get('is_rate_limited'),
            'collection_interval': st.get('collection_interval'),
        }, shot=False)

        # ---- TC-13 -------------------------------------------------------
        status, headers, body = api_get(f'{base}/api/backup')
        cd = headers.get('content-disposition', '')
        m = re.search(r'filename="?([^";]+)', cd)
        record('TC-13', {
            'http_status': status,
            'filename_regex': m.group(1) if m else None,
            'sqlite_header': body[:16] == b'SQLite format 3\x00',
        }, shot=False)

        # ---- TC-14 -------------------------------------------------------
        _, stats = api_get_json(f'{base}/api/latency-stats')
        record('TC-14', {k: stats.get(k) for k in
                         ['total_calls', 'avg_latency_ms', 'min_latency_ms',
                          'max_latency_ms', 'successful_calls', 'failed_calls',
                          'success_rate']}, shot=False)

        # ---- TC-15 -------------------------------------------------------
        _, all_logs = api_get_json(f'{base}/api/latency-logs')
        _, fe = api_get_json(f'{base}/api/latency-logs?endpoint=/devices')
        _, fd = api_get_json(f'{base}/api/latency-logs?device_id=SEED-D1')
        _, fl = api_get_json(f'{base}/api/latency-logs?limit=2')
        record('TC-15', {
            'order_endpoints': [l['endpoint'] for l in all_logs['logs']],
            'filter_endpoint_count': fe['count'],
            'filter_device_count': fd['count'],
            'limit2_count': fl['count'],
        }, shot=False)

        # ---- TC-19 -------------------------------------------------------
        before = page.inner_text('#status-last-refresh').strip()
        time.sleep(35)
        after = page.inner_text('#status-last-refresh').strip()
        record('TC-19', {'last_refresh_changed': before != after,
                         'before': before, 'after': after})

        # ---- TC-10 -------------------------------------------------------
        with page.expect_response('**/api/meters/refresh') as rinfo:
            # click + read synchronously so we catch the transient button text
            btn_during = page.evaluate(
                "() => { const b = document.querySelector('#btn-refresh');"
                " b.click(); return b.textContent.trim(); }")
        refresh_status = rinfo.value.status
        # follow-up fetchData() fires after the refresh callback; give it time
        page.wait_for_timeout(2000)
        record('TC-10', {
            'refresh_http_status': refresh_status,
            'button_during': btn_during,
            'final_button': page.inner_text('#btn-refresh').strip(),
            'final_connection': page.inner_text('#connection-status').strip(),
            'final_error_visible': page.is_visible('#error'),
        })

        # ---- TC-16 (mutates; last among seeded cases) --------------------
        payload = json.loads(Path(args.import_extra).read_text())
        imp_status, imp = api_post_json(f'{base}/api/import', payload)
        page.reload()
        wait_dashboard(page)
        panels = page.evaluate(PANEL_JS)
        record('TC-16', {
            'imported_devices': imp.get('imported_devices') if imp else None,
            'imported_readings': imp.get('imported_readings') if imp else None,
            'new_display_name': '遠心分離機 (S-701)' if any(p['name'] == '遠心分離機 (S-701)' for p in panels) else None,
            'status_text': page.inner_text('#status-meters-count').strip(),
        })

        # ---- TC-11 -------------------------------------------------------
        port = int(base.rsplit(':', 1)[-1])
        kill_port(port)
        page.click('#btn-refresh')
        page.wait_for_selector('#error', state='visible', timeout=15000)
        record('TC-11', {
            'connection': page.inner_text('#connection-status').strip(),
            'error_prefix': page.inner_text('#error-text').strip()[:len('Failed to ')],
            'error_text': page.inner_text('#error-text').strip(),
        })
        # restore: restart + reseed
        subprocess.run(['bash', str(HERE / 'reset_and_seed.sh'), str(port)],
                       check=True, capture_output=False)
        page.goto(page_url)
        wait_dashboard(page)

        # ---- TC-18 (real SwitchBot API; run once) ------------------------
        if not args.skip_tc18:
            db2 = str(results_dir / f'legacy_seed_{CREDS_PORT}.db')
            kill_port(CREDS_PORT)
            if os.path.exists(db2):
                os.remove(db2)
            subprocess.run(['bash', str(HERE / 'start_legacy.sh'), str(CREDS_PORT), db2,
                            '--with-creds'], check=True)
            try:
                r_status, r = api_post_json(f'http://localhost:{CREDS_PORT}/api/meters/refresh', timeout=180)
                _, meters_resp = api_get_json(f'http://localhost:{CREDS_PORT}/api/meters')
                _, st18 = api_get_json(f'http://localhost:{CREDS_PORT}/api/status')
                meters = meters_resp.get('meters', [])
                import datetime as _dt
                now_ms = time.time() * 1000
                def fresh(m):
                    lu = m.get('last_updated')
                    if not lu:
                        return False
                    try:
                        t = _dt.datetime.fromisoformat(lu.replace('Z', '+00:00')).timestamp() * 1000
                    except Exception:
                        return False
                    return (now_ms - t) < STALE_MS
                active = [m for m in meters if fresh(m)]
                record('TC-18', {
                    'refresh_http_status': r_status,
                    'meter_device_ids': sorted(m['device_id'] for m in meters),
                    'device_types': {m['device_id']: m.get('device_type') for m in meters},
                    'all_active_have_temperature': all(
                        m.get('current_temperature') is not None for m in active) if active else None,
                    'active_count': len(active),
                    'configured': st18.get('configured'),
                }, shot=False, expected={'all_active_have_temperature': True})
            finally:
                kill_port(CREDS_PORT)

        # ---- TC-20 (read-only vs production snakeroom) -------------------
        page.goto(prod_url)
        wait_dashboard(page)
        _, st20 = api_get_json('https://snakeroom.fly.dev/api/status')
        record('TC-20', {
            'status_text': page.inner_text('#status-meters-count').strip(),
            'connection': page.inner_text('#connection-status').strip(),
            'meters_count_api': st20.get('meters_count'),
        })

        browser.close()

    httpd.shutdown()
    out_path = results_dir / 'legacy.json'
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"\nWrote {out_path}")


if __name__ == '__main__':
    main()
