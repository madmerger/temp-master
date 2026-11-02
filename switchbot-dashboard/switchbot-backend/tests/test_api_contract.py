import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import httpx
import pytest
from jsonschema import Draft202012Validator
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import MeterDevice, MeterReading, TimeScale, data_store, save_reading_to_db


SCHEMA_PATH = Path(__file__).resolve().parents[2] / "contract" / "api-schema.json"
MOCK_SCENARIO_PATH = SCHEMA_PATH.parent / "fixtures" / "mock-scenario.json"


@pytest.fixture(scope="module")
def schema():
    value = json.loads(SCHEMA_PATH.read_text())
    Draft202012Validator.check_schema(value)
    return value


def validate(schema, definition, value):
    wrapped = {
        "$schema": schema["$schema"],
        "$defs": schema["$defs"],
        "$ref": f"#/$defs/{definition}",
    }
    errors = sorted(Draft202012Validator(wrapped).iter_errors(value), key=str)
    assert not errors, "\n".join(error.message for error in errors)


@pytest.fixture
def client(reset_data_store):
    return TestClient(main_module.app)


def seed_devices(now):
    devices = [
        MeterDevice(
            device_id="full",
            device_name="Full Meter",
            device_type="Meter",
            hub_device_id="hub",
            current_temperature=24.1,
            current_humidity=65,
            battery=80,
            last_updated=now,
        ),
        MeterDevice(
            device_id="hub",
            device_name="Hub 3",
            device_type="Hub 3",
            hub_device_id=None,
            current_temperature=21.0,
            current_humidity=55,
            battery=None,
            last_updated=now,
        ),
        MeterDevice(
            device_id="empty",
            device_name="Empty",
            device_type="Meter",
            current_temperature=None,
            current_humidity=None,
            battery=None,
            last_updated=None,
        ),
    ]
    data_store.devices = {device.device_id: device for device in devices}
    data_store.history = {device.device_id: [] for device in devices}


def test_meters_responses_validate_for_populated_and_empty_store(client, schema):
    now = datetime.now(timezone.utc)
    seed_devices(now)
    validate(schema, "MetersResponse", client.get("/api/meters").json())

    data_store.devices = {}
    data_store.history = {}
    validate(schema, "MetersResponse", client.get("/api/meters").json())


def test_status_validates_configured_and_rate_limited_states(client, schema):
    unconfigured = client.get("/api/status").json()
    assert unconfigured["configured"] is False
    validate(schema, "StatusResponse", unconfigured)
    with patch.object(main_module, "SWITCHBOT_TOKEN", "token"), \
         patch.object(main_module, "SWITCHBOT_SECRET", "secret"):
        data_store.backoff_until = time.time() + 60
        rate_limited = client.get("/api/status").json()
        assert rate_limited["configured"] is True
        assert rate_limited["is_rate_limited"] is True
        validate(schema, "StatusResponse", rate_limited)


@pytest.mark.asyncio
async def test_history_validates_for_every_time_scale(client, schema, reset_data_store):
    now = datetime.now(timezone.utc)
    device = MeterDevice(
        device_id="history-device",
        device_name="History Meter",
        device_type="Meter",
        last_updated=now,
    )
    data_store.devices[device.device_id] = device
    data_store.history[device.device_id] = []
    await save_reading_to_db(
        device.device_id,
        MeterReading(timestamp=now - timedelta(minutes=1), temperature=22.2, humidity=60, battery=None),
    )

    for scale in TimeScale:
        response = client.get(f"/api/meters/{device.device_id}/history?time_scale={scale.value}")
        assert response.status_code == 200
        assert response.json()["time_scale"] == scale.value
        validate(schema, "HistoryResponse", response.json())


def test_error_responses_validate(client, schema, reset_data_store):
    response = client.get("/api/meters/missing/history")
    assert response.status_code == 404
    assert response.json()["detail"] == "Device not found"
    validate(schema, "ErrorResponse", response.json())

    with patch.object(main_module, "SWITCHBOT_TOKEN", ""), \
         patch.object(main_module, "SWITCHBOT_SECRET", ""):
        response = client.post("/api/meters/refresh")
    assert response.status_code == 500
    validate(schema, "ErrorResponse", response.json())


def test_schema_rejects_vacuous_meter_history_and_timestamp(schema):
    meter = {
        "device_id": "id",
        "device_name": "name",
        "device_type": "Meter",
        "hub_device_id": None,
        "current_humidity": 65,
        "battery": None,
        "last_updated": None,
    }
    with pytest.raises(AssertionError):
        validate(schema, "Meter", meter)

    meter["current_temperature"] = 20
    meter["current_humidity"] = "65"
    with pytest.raises(AssertionError):
        validate(schema, "Meter", meter)

    history = {
        "device_id": "id",
        "time_scale": "minute",
        "history": [],
        "device": None,
    }
    with pytest.raises(AssertionError):
        validate(schema, "HistoryResponse", history)

    with pytest.raises(AssertionError):
        validate(schema, "MeterReading", {
            "timestamp": "2026/11/02",
            "temperature": 20,
            "humidity": 50,
            "battery": None,
        })


def test_mock_scenario_fixture_validates_every_part(schema):
    scenario = json.loads(MOCK_SCENARIO_PATH.read_text())
    validate(schema, "MetersResponse", scenario["meters"])
    validate(schema, "StatusResponse", scenario["status"])
    validate(schema, "HistoryResponse", scenario["history"]["C76B0046301A"]["day"])
    assert len(scenario["meters"]["meters"]) == 6
    assert len(scenario["history"]["C76B0046301A"]["day"]["history"]) == 12


@pytest.mark.live_contract
def test_live_contract_is_read_only_and_opt_in(schema):
    base_url = os.getenv("CONTRACT_API_URL")
    if not base_url:
        pytest.skip("CONTRACT_API_URL is not set")

    with httpx.Client(base_url=base_url.rstrip("/"), timeout=20) as live_client:
        meters_response = live_client.get("/api/meters")
        status_response = live_client.get("/api/status")
        assert meters_response.is_success
        assert status_response.is_success
        validate(schema, "MetersResponse", meters_response.json())
        validate(schema, "StatusResponse", status_response.json())

        meters = meters_response.json()["meters"]
        device = next((meter for meter in meters if meter["last_updated"] is not None), None)
        if device:
            history_response = live_client.get(
                f"/api/meters/{device['device_id']}/history",
                params={"time_scale": "day"},
            )
            assert history_response.is_success
            validate(schema, "HistoryResponse", history_response.json())
