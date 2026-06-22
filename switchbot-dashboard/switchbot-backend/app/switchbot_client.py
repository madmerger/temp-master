import base64
import hashlib
import hmac
import time
import uuid
from typing import Optional

import httpx
from fastapi import HTTPException

from app import config
from app.database import save_latency_log
from app.models import MeterDevice
from app.state import data_store


def generate_switchbot_headers() -> dict:
    if not config.SWITCHBOT_TOKEN or not config.SWITCHBOT_SECRET:
        return {}

    nonce = str(uuid.uuid4())
    t = int(round(time.time() * 1000))
    string_to_sign = f"{config.SWITCHBOT_TOKEN}{t}{nonce}"

    string_to_sign_bytes = bytes(string_to_sign, "utf-8")
    secret_bytes = bytes(config.SWITCHBOT_SECRET, "utf-8")

    sign = base64.b64encode(
        hmac.new(secret_bytes, msg=string_to_sign_bytes, digestmod=hashlib.sha256).digest()
    )

    return {
        "Authorization": config.SWITCHBOT_TOKEN,
        "Content-Type": "application/json",
        "charset": "utf8",
        "t": str(t),
        "sign": str(sign, "utf-8"),
        "nonce": nonce,
    }


async def call_switchbot_api(endpoint: str, device_id: Optional[str] = None) -> dict:
    if time.time() < data_store.backoff_until:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limited. Retry after {int(data_store.backoff_until - time.time())} seconds",
        )

    headers = generate_switchbot_headers()
    if not headers:
        raise HTTPException(status_code=500, detail="SwitchBot credentials not configured")

    start_time = time.perf_counter()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{config.SWITCHBOT_API_BASE}{endpoint}", headers=headers)
            end_time = time.perf_counter()
            latency_ms = (end_time - start_time) * 1000
            data_store.last_api_call = time.time()

            if response.status_code == 429:
                data_store.consecutive_errors += 1
                backoff_time = min(
                    config.RATE_LIMIT_BACKOFF_BASE * (2 ** data_store.consecutive_errors),
                    config.MAX_BACKOFF,
                )
                data_store.backoff_until = time.time() + backoff_time
                await save_latency_log(
                    endpoint=endpoint,
                    latency_ms=latency_ms,
                    status_code=429,
                    success=False,
                    device_id=device_id,
                    error_message=f"Rate limited. Backing off for {backoff_time} seconds",
                )
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limited by SwitchBot API. Backing off for {backoff_time} seconds",
                )

            if response.status_code != 200:
                await save_latency_log(
                    endpoint=endpoint,
                    latency_ms=latency_ms,
                    status_code=response.status_code,
                    success=False,
                    device_id=device_id,
                    error_message=f"SwitchBot API error: {response.text}",
                )
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"SwitchBot API error: {response.text}",
                )

            await save_latency_log(
                endpoint=endpoint,
                latency_ms=latency_ms,
                status_code=200,
                success=True,
                device_id=device_id,
            )
            data_store.consecutive_errors = 0
            return response.json()

        except httpx.RequestError as e:
            end_time = time.perf_counter()
            latency_ms = (end_time - start_time) * 1000
            await save_latency_log(
                endpoint=endpoint,
                latency_ms=latency_ms,
                status_code=500,
                success=False,
                device_id=device_id,
                error_message=f"Request error: {str(e)}",
            )
            raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")


async def fetch_devices() -> list[MeterDevice]:
    response = await call_switchbot_api("/devices")

    if response.get("statusCode") != 100:
        raise HTTPException(
            status_code=500,
            detail=f"SwitchBot API returned error: {response.get('message', 'Unknown error')}",
        )

    devices = []
    device_list = response.get("body", {}).get("deviceList", [])

    for device in device_list:
        device_type = device.get("deviceType", "")
        if device_type in config.METER_DEVICE_TYPES:
            meter = MeterDevice(
                device_id=device.get("deviceId", ""),
                device_name=device.get("deviceName", "Unknown"),
                device_type=device_type,
                hub_device_id=device.get("hubDeviceId"),
            )
            devices.append(meter)

    return devices


async def fetch_device_status(device_id: str) -> dict:
    response = await call_switchbot_api(f"/devices/{device_id}/status", device_id=device_id)

    if response.get("statusCode") != 100:
        raise HTTPException(
            status_code=500,
            detail=f"SwitchBot API returned error: {response.get('message', 'Unknown error')}",
        )

    return response.get("body", {})
