#!/usr/bin/env python3
"""Evaluate the freshness of the external Snakeroom meter data."""

import argparse
import datetime
import json
import os
import urllib.request


DEFAULT_API_BASE = "https://snakeroom.fly.dev"
DEFAULT_COLLECTION_INTERVAL_SECONDS = 120
DEFAULT_TIMEOUT_SECONDS = 15


class FetchError(Exception):
    """Raised when an API payload cannot be fetched."""


def _as_utc(value):
    if isinstance(value, datetime.datetime):
        parsed = value
    elif isinstance(value, str):
        text = value.replace("Z", "+00:00")
        try:
            parsed = datetime.datetime.fromisoformat(text)
        except ValueError:
            return None
    else:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=datetime.timezone.utc)
    return parsed.astimezone(datetime.timezone.utc)


def _isoformat(value):
    return value.isoformat().replace("+00:00", "Z") if value else None


def _meter_list(meters_payload):
    if isinstance(meters_payload, dict):
        meters = meters_payload.get("meters", [])
    else:
        meters = meters_payload
    return meters if isinstance(meters, list) else []


def _duration_label(seconds):
    hours = seconds / (60 * 60)
    return str(int(hours)) + "時間" if hours.is_integer() else f"{hours:g}時間"


def _result(severity, reasons, newest, age_seconds, meters_count, lagging, status):
    return {
        "severity": severity,
        "reasons": reasons,
        "newest_last_updated": _isoformat(newest),
        "age_seconds": age_seconds,
        "meters_count": meters_count,
        "lagging_meters": lagging,
        "configured": status.get("configured"),
        "is_rate_limited": status.get("is_rate_limited"),
        "backoff_remaining": status.get("backoff_remaining"),
        "last_api_call": status.get("last_api_call"),
        "collection_interval": status.get("collection_interval"),
    }


def evaluate(
    meters_payload,
    status_payload,
    now,
    warn_threshold_seconds=60 * 60,
    critical_threshold_seconds=24 * 60 * 60,
    meter_lag_threshold_seconds=24 * 60 * 60,
    collection_interval_seconds=DEFAULT_COLLECTION_INTERVAL_SECONDS,
):
    """Return a normalized freshness assessment without performing any I/O."""
    current = _as_utc(now)
    if current is None:
        raise ValueError("now must be a datetime")

    status = status_payload if isinstance(status_payload, dict) else {}
    meters = _meter_list(meters_payload)
    timestamps = []
    for meter in meters:
        if not isinstance(meter, dict):
            continue
        parsed = _as_utc(meter.get("last_updated"))
        if parsed is not None:
            timestamps.append((parsed, meter))

    newest = max((item[0] for item in timestamps), default=None)
    age_seconds = (current - newest).total_seconds() if newest else None
    meters_count = status.get("meters_count")
    if meters_count is None:
        meters_count = len(meters)
    reasons = []
    critical = False
    warning = False
    lagging = []

    if meters_count == 0:
        critical = True
        reasons.append("メーター数が0です")
    if status.get("configured") is False:
        critical = True
        reasons.append("バックエンドの認証設定が無効です")
    if status.get("is_rate_limited") is True:
        warning = True
        reasons.append("SwitchBot APIがレートリミット中です")

    last_api_call = status.get("last_api_call")
    try:
        last_api_call = float(last_api_call)
    except (TypeError, ValueError):
        last_api_call = None
    interval = status.get("collection_interval", collection_interval_seconds)
    try:
        interval = float(interval)
    except (TypeError, ValueError):
        interval = collection_interval_seconds
    if last_api_call and current.timestamp() - last_api_call > interval * 3:
        critical = True
        reasons.append("データ収集ループの最終API呼び出しから長時間経過しています")

    if newest is None:
        critical = True
        reasons.append("有効な最終更新時刻がありません")
    else:
        if age_seconds > critical_threshold_seconds:
            critical = True
            reasons.append(
                "最新データが" + _duration_label(critical_threshold_seconds) + "以上古いです"
            )
        elif age_seconds > warn_threshold_seconds:
            warning = True
            reasons.append(
                "最新データが" + _duration_label(warn_threshold_seconds) + "以上古いです"
            )

        for parsed, meter in timestamps:
            lag_seconds = (newest - parsed).total_seconds()
            if lag_seconds > meter_lag_threshold_seconds:
                lagging.append({
                    "device_id": meter.get("device_id"),
                    "device_name": meter.get("device_name"),
                })
    severity = "CRITICAL" if critical else "WARN" if warning else "OK"
    return _result(severity, reasons, newest, age_seconds, meters_count, lagging, status)


def evaluate_fetch_failure(message):
    """Return a normalized CRITICAL result for an unavailable API."""
    return _result(
        "CRITICAL",
        ["データ取得に失敗しました: " + str(message)],
        None,
        None,
        0,
        [],
        {},
    )


def fetch_json(url, timeout):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            if response.status < 200 or response.status >= 300:
                raise FetchError("HTTP " + str(response.status) + " from " + url)
            return json.loads(response.read().decode("utf-8"))
    except FetchError:
        raise
    except Exception as exc:
        raise FetchError(str(exc)) from exc


def fetch_payloads(api_base, timeout):
    base = api_base.rstrip("/")
    return fetch_json(base + "/api/meters", timeout), fetch_json(base + "/api/status", timeout)


def _summary(result):
    return result["severity"] + ": " + " / ".join(result["reasons"]) if result["reasons"] else result["severity"]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-base", default=DEFAULT_API_BASE)
    parser.add_argument("--warn-hours", type=float, default=1)
    parser.add_argument("--critical-hours", type=float, default=24)
    parser.add_argument("--lag-hours", type=float, default=24)
    parser.add_argument("--collection-interval", type=float, default=DEFAULT_COLLECTION_INTERVAL_SECONDS)
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument("--github-output", action="store_true")
    args = parser.parse_args(argv)

    now = datetime.datetime.now(datetime.timezone.utc)
    try:
        meters_payload, status_payload = fetch_payloads(args.api_base, args.timeout)
        result = evaluate(
            meters_payload,
            status_payload,
            now,
            warn_threshold_seconds=args.warn_hours * 60 * 60,
            critical_threshold_seconds=args.critical_hours * 60 * 60,
            meter_lag_threshold_seconds=args.lag_hours * 60 * 60,
            collection_interval_seconds=args.collection_interval,
        )
    except FetchError as exc:
        result = evaluate_fetch_failure(exc)

    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.github_output:
        output_path = os.environ.get("GITHUB_OUTPUT")
        if output_path:
            with open(output_path, "a", encoding="utf-8") as output:
                output.write("severity=" + result["severity"] + "\n")
                output.write("summary=" + _summary(result).replace("\n", " ") + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
