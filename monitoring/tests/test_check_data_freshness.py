import datetime
import sys
import urllib.error
from pathlib import Path
from unittest import mock

import pytest


SCRIPT = Path(__file__).parents[1] / "check_data_freshness.py"
NOW = datetime.datetime(2026, 7, 28, 12, 0, tzinfo=datetime.timezone.utc)
sys.path.insert(0, str(SCRIPT.parent))
from check_data_freshness import (  # noqa: E402
    FetchError,
    evaluate,
    evaluate_fetch_failure,
    fetch_json,
)


def meter(device_id, updated, name=None):
    return {"device_id": device_id, "device_name": name or device_id, "last_updated": updated}


def payloads(updated="2026-07-28T11:30:00Z", status=None):
    return {"meters": [meter("one", updated)]}, {
        "configured": True,
        "meters_count": 1,
        "is_rate_limited": False,
        "last_api_call": NOW.timestamp() - 60,
        **(status or {}),
    }


def test_ok():
    meters, status = payloads()
    assert evaluate(meters, status, NOW)["severity"] == "OK"


def test_one_hour_stale_is_warn():
    meters, status = payloads("2026-07-28T10:30:00Z")
    result = evaluate(meters, status, NOW)
    assert result["severity"] == "WARN"
    assert result["age_seconds"] == 5400


def test_24_hours_stale_is_critical():
    meters, status = payloads("2026-07-27T11:59:59Z")
    assert evaluate(meters, status, NOW)["severity"] == "CRITICAL"


def test_zero_meters_is_critical():
    meters, status = payloads()
    status["meters_count"] = 0
    result = evaluate(meters, status, NOW)
    assert result["severity"] == "CRITICAL"


def test_unconfigured_is_critical():
    meters, status = payloads(status={"configured": False})
    assert evaluate(meters, status, NOW)["severity"] == "CRITICAL"


def test_rate_limited_is_warn():
    meters, status = payloads(status={"is_rate_limited": True, "backoff_remaining": 10})
    result = evaluate(meters, status, NOW)
    assert result["severity"] == "WARN"
    assert result["backoff_remaining"] == 10


def test_old_last_api_call_is_critical():
    meters, status = payloads(status={"last_api_call": NOW.timestamp() - 361})
    assert evaluate(meters, status, NOW, collection_interval_seconds=120)["severity"] == "CRITICAL"


def test_status_collection_interval_controls_last_api_call_threshold():
    meters, status = payloads(status={"last_api_call": NOW.timestamp() - 361, "collection_interval": 120})
    assert evaluate(meters, status, NOW, collection_interval_seconds=1000)["severity"] == "CRITICAL"


def test_zero_last_api_call_is_unknown():
    meters, status = payloads(status={"last_api_call": 0})
    assert evaluate(meters, status, NOW)["severity"] == "OK"


def test_missing_last_api_call_is_unknown():
    meters, status = payloads()
    del status["last_api_call"]
    assert evaluate(meters, status, NOW)["severity"] == "OK"


def test_lagging_meter_is_warn():
    meters, status = payloads()
    meters["meters"].append(meter("late", "2026-07-27T11:00:00Z"))
    result = evaluate(meters, status | {"meters_count": 2}, NOW)
    assert result["severity"] == "WARN"
    assert result["lagging_meters"] == [{"device_id": "late", "device_name": "late"}]


def test_no_valid_timestamp_is_critical():
    meters, status = payloads("not-a-date")
    result = evaluate(meters, status, NOW)
    assert result["severity"] == "CRITICAL"
    assert result["newest_last_updated"] is None


def test_fetch_failure_result_is_critical():
    result = evaluate_fetch_failure("timeout")
    assert result["severity"] == "CRITICAL"
    assert "timeout" in result["reasons"][0]


def test_fetch_failure_path_is_stubbed_without_network():
    with mock.patch("urllib.request.urlopen", side_effect=TimeoutError("timed out")):
        with pytest.raises(FetchError):
            fetch_json("https://example.invalid", 1)


def test_http_failure_path_is_stubbed_without_network():
    error = urllib.error.HTTPError("https://example.invalid", 503, "unavailable", {}, None)
    with mock.patch("urllib.request.urlopen", side_effect=error):
        with pytest.raises(FetchError, match="503"):
            fetch_json("https://example.invalid", 1)
