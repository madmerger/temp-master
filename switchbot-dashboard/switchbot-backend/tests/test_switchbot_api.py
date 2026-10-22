import time
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi import HTTPException

import app.main as main_module
from app.main import (
    call_switchbot_api,
    data_store,
    fetch_device_status,
    fetch_devices,
    generate_switchbot_headers,
    METER_DEVICE_TYPES,
    RATE_LIMIT_BACKOFF_BASE,
    MAX_BACKOFF,
)


class TestGenerateSwitchbotHeaders:
    def test_generate_headers_with_credentials(self):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"):
            headers = generate_switchbot_headers()
            
            assert "Authorization" in headers
            assert headers["Authorization"] == "test-token"
            assert "Content-Type" in headers
            assert headers["Content-Type"] == "application/json"
            assert "t" in headers
            assert "sign" in headers
            assert "nonce" in headers
            assert headers["charset"] == "utf8"

    def test_generate_headers_without_token(self):
        with patch.object(main_module, "SWITCHBOT_TOKEN", ""), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"):
            headers = generate_switchbot_headers()
            assert headers == {}

    def test_generate_headers_without_secret(self):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", ""):
            headers = generate_switchbot_headers()
            assert headers == {}

    def test_generate_headers_without_credentials(self):
        with patch.object(main_module, "SWITCHBOT_TOKEN", ""), \
             patch.object(main_module, "SWITCHBOT_SECRET", ""):
            headers = generate_switchbot_headers()
            assert headers == {}

    def test_generate_headers_timestamp_is_recent(self):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"):
            before = int(time.time() * 1000) - 1000
            headers = generate_switchbot_headers()
            after = int(time.time() * 1000) + 1000
            
            timestamp = int(headers["t"])
            assert before <= timestamp <= after

    def test_generate_headers_nonce_is_uuid(self):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"):
            headers = generate_switchbot_headers()
            
            nonce = headers["nonce"]
            assert len(nonce) == 36
            assert nonce.count("-") == 4


class TestCallSwitchbotApi:
    async def test_call_api_success(self, reset_data_store):
        from unittest.mock import MagicMock
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"statusCode": 100, "body": {}}
        
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            result = await call_switchbot_api("/devices")
            
            assert result == {"statusCode": 100, "body": {}}
            assert data_store.consecutive_errors == 0

    async def test_call_api_rate_limited_429(self, reset_data_store):
        from unittest.mock import MagicMock
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.text = "Rate limited"
        
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            with pytest.raises(HTTPException) as exc_info:
                await call_switchbot_api("/devices")
            
            assert exc_info.value.status_code == 429
            assert data_store.consecutive_errors == 1
            assert data_store.backoff_until > time.time()

    async def test_call_api_during_backoff(self, reset_data_store):
        data_store.backoff_until = time.time() + 60
        
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"):
            with pytest.raises(HTTPException) as exc_info:
                await call_switchbot_api("/devices")
            
            assert exc_info.value.status_code == 429
            assert "Rate limited" in exc_info.value.detail

    async def test_call_api_non_200_error(self, reset_data_store):
        from unittest.mock import MagicMock
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "SECRET-BODY"
        
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("httpx.AsyncClient") as mock_client, \
             patch("app.main.save_latency_log", new_callable=AsyncMock) as mock_save_latency_log:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            with pytest.raises(HTTPException) as exc_info:
                await call_switchbot_api("/devices")
            
            assert exc_info.value.status_code == 500
            assert "SECRET-BODY" not in exc_info.value.detail
            assert "HTTP 500" in exc_info.value.detail
            mock_save_latency_log.assert_awaited_once()
            assert "SECRET-BODY" not in mock_save_latency_log.await_args.kwargs["error_message"]

    async def test_call_api_request_error(self, reset_data_store):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("httpx.AsyncClient") as mock_client, \
             patch("app.main.save_latency_log", new_callable=AsyncMock) as mock_save_latency_log:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=httpx.RequestError("Connection failed")
            )
            
            with pytest.raises(HTTPException) as exc_info:
                await call_switchbot_api("/devices")
            
            assert exc_info.value.status_code == 500
            assert exc_info.value.detail == "Request error: RequestError"
            assert "Connection failed" not in exc_info.value.detail
            assert "Connection failed" not in mock_save_latency_log.await_args.kwargs["error_message"]

    async def test_call_api_no_credentials(self, reset_data_store):
        with patch.object(main_module, "SWITCHBOT_TOKEN", ""), \
             patch.object(main_module, "SWITCHBOT_SECRET", ""):
            with pytest.raises(HTTPException) as exc_info:
                await call_switchbot_api("/devices")
            
            assert exc_info.value.status_code == 500
            assert "credentials not configured" in exc_info.value.detail

    async def test_call_api_updates_last_api_call(self, reset_data_store):
        from unittest.mock import MagicMock
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"statusCode": 100, "body": {}}
        
        before = time.time()
        
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            await call_switchbot_api("/devices")
            
            after = time.time()
            assert before <= data_store.last_api_call <= after


class TestExponentialBackoff:
    async def test_exponential_backoff_calculation(self, reset_data_store):
        from unittest.mock import MagicMock
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.text = "Rate limited"
        
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            data_store.consecutive_errors = 0
            data_store.backoff_until = 0
            
            try:
                await call_switchbot_api("/devices")
            except HTTPException:
                pass
            
            expected_backoff = RATE_LIMIT_BACKOFF_BASE * (2 ** 1)
            assert data_store.consecutive_errors == 1
            assert data_store.backoff_until >= time.time() + expected_backoff - 1

    async def test_max_backoff_cap(self, reset_data_store):
        from unittest.mock import MagicMock
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.text = "Rate limited"
        
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            data_store.consecutive_errors = 10
            data_store.backoff_until = 0
            
            try:
                await call_switchbot_api("/devices")
            except HTTPException:
                pass
            
            assert data_store.backoff_until <= time.time() + MAX_BACKOFF + 1

    async def test_consecutive_errors_reset_on_success(self, reset_data_store):
        from unittest.mock import MagicMock
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"statusCode": 100, "body": {}}
        
        data_store.consecutive_errors = 5
        
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            await call_switchbot_api("/devices")
            
            assert data_store.consecutive_errors == 0


class TestFetchDevices:
    async def test_fetch_devices_filters_meter_types(self, reset_data_store, sample_switchbot_devices_response):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("app.main.call_switchbot_api", new_callable=AsyncMock) as mock_api:
            mock_api.return_value = sample_switchbot_devices_response
            
            devices = await fetch_devices()
            
            assert len(devices) == 2
            device_types = [d.device_type for d in devices]
            assert "Meter" in device_types
            assert "MeterPlus" in device_types
            assert "Light" not in device_types

    async def test_fetch_devices_handles_api_error(self, reset_data_store):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("app.main.call_switchbot_api", new_callable=AsyncMock) as mock_api:
            mock_api.return_value = {
                "statusCode": 190,
                "message": "System error",
            }
            
            with pytest.raises(HTTPException) as exc_info:
                await fetch_devices()
            
            assert exc_info.value.status_code == 500

    async def test_fetch_devices_empty_list(self, reset_data_store):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("app.main.call_switchbot_api", new_callable=AsyncMock) as mock_api:
            mock_api.return_value = {
                "statusCode": 100,
                "body": {"deviceList": []},
            }
            
            devices = await fetch_devices()
            
            assert devices == []

    async def test_fetch_devices_extracts_device_info(self, reset_data_store, sample_switchbot_devices_response):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("app.main.call_switchbot_api", new_callable=AsyncMock) as mock_api:
            mock_api.return_value = sample_switchbot_devices_response
            
            devices = await fetch_devices()
            
            device = next(d for d in devices if d.device_id == "device-001")
            assert device.device_name == "Living Room Meter"
            assert device.device_type == "Meter"
            assert device.hub_device_id == "hub-001"

    async def test_fetch_devices_skips_invalid_meter_ids(self, reset_data_store):
        response = {
            "statusCode": 100,
            "body": {
                "deviceList": [
                    {"deviceId": "C271111EC0AB", "deviceName": "Valid Meter", "deviceType": "Meter"},
                    {"deviceId": "a/b", "deviceName": "Invalid Meter", "deviceType": "Meter"},
                ]
            },
        }
        with patch("app.main.call_switchbot_api", new_callable=AsyncMock, return_value=response):
            devices = await fetch_devices()

        assert [device.device_id for device in devices] == ["C271111EC0AB"]


class TestFetchDeviceStatus:
    async def test_fetch_device_status(self, reset_data_store, sample_switchbot_status_response):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("app.main.call_switchbot_api", new_callable=AsyncMock) as mock_api:
            mock_api.return_value = sample_switchbot_status_response
            
            status = await fetch_device_status("device-001")
            
            assert status["temperature"] == 24.5
            assert status["humidity"] == 55
            assert status["battery"] == 90

    async def test_fetch_device_status_rejects_invalid_device_id(self, reset_data_store):
        with patch("app.main.call_switchbot_api", new_callable=AsyncMock) as mock_api:
            with pytest.raises(HTTPException) as exc_info:
                await fetch_device_status("../../v1.0/scenes#")

        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == "Invalid device_id"
        mock_api.assert_not_called()

    async def test_fetch_device_status_uses_validated_device_path(self, reset_data_store):
        response = {"statusCode": 100, "body": {"temperature": 24.5}}
        with patch("app.main.call_switchbot_api", new_callable=AsyncMock) as mock_api:
            mock_api.return_value = response

            await fetch_device_status("C271111EC0AB")

        mock_api.assert_awaited_once_with(
            "/devices/C271111EC0AB/status",
            device_id="C271111EC0AB",
        )

    async def test_fetch_device_status_handles_api_error(self, reset_data_store):
        with patch.object(main_module, "SWITCHBOT_TOKEN", "test-token"), \
             patch.object(main_module, "SWITCHBOT_SECRET", "test-secret"), \
             patch("app.main.call_switchbot_api", new_callable=AsyncMock) as mock_api:
            mock_api.return_value = {
                "statusCode": 190,
                "message": "Device not found",
            }
            
            with pytest.raises(HTTPException) as exc_info:
                await fetch_device_status("nonexistent-device")
            
            assert exc_info.value.status_code == 500


class TestMeterDeviceTypes:
    def test_meter_device_types_contains_expected_types(self):
        expected_types = ["Meter", "MeterPlus", "WoIOSensor", "Meter Plus (JP)", "Meter Pro", "Meter Pro CO2", "Hub 2"]
        for device_type in expected_types:
            assert device_type in METER_DEVICE_TYPES

    def test_meter_device_types_is_list(self):
        assert isinstance(METER_DEVICE_TYPES, list)
