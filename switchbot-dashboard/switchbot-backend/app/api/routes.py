import os
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

import app.config as config
from app.db import (
    get_latency_logs,
    get_latency_stats,
    get_readings_from_db,
    save_device_to_db,
    save_reading_to_db,
)
from app.models import (
    ImportData,
    MeterDevice,
    MeterReading,
    TimeScale,
    data_store,
)
from app.services import collect_data

router = APIRouter()


@router.get("/healthz")
async def healthz():
    return {"status": "ok"}


@router.get("/api/meters")
async def get_meters():
    meters = list(data_store.devices.values())
    return {
        "meters": [meter.model_dump() for meter in meters],
        "last_updated": max(
            (m.last_updated for m in meters if m.last_updated),
            default=None,
        ),
    }


@router.get("/api/meters/{device_id}/history")
async def get_meter_history(device_id: str, time_scale: TimeScale = TimeScale.HOUR):
    if device_id not in data_store.devices:
        raise HTTPException(status_code=404, detail="Device not found")

    now = datetime.now(timezone.utc)

    if time_scale == TimeScale.HOUR:
        cutoff = now.timestamp() - 3600
    elif time_scale == TimeScale.DAY:
        cutoff = now.timestamp() - 86400
    elif time_scale == TimeScale.WEEK:
        cutoff = now.timestamp() - 604800
    elif time_scale == TimeScale.MONTH:
        cutoff = now.timestamp() - 2592000
    else:
        cutoff = now.timestamp() - 31536000

    filtered_history = await get_readings_from_db(device_id, cutoff)

    return {
        "device_id": device_id,
        "time_scale": time_scale,
        "history": [reading.model_dump() for reading in filtered_history],
        "device": data_store.devices.get(device_id).model_dump() if device_id in data_store.devices else None,
    }


@router.post("/api/meters/refresh")
async def refresh_meters():
    if not config.SWITCHBOT_TOKEN or not config.SWITCHBOT_SECRET:
        raise HTTPException(status_code=500, detail="SwitchBot credentials not configured")

    await collect_data()

    return {
        "status": "ok",
        "message": "Data collection triggered",
        "meters_count": len(data_store.devices),
    }


@router.get("/api/status")
async def get_status():
    return {
        "configured": bool(config.SWITCHBOT_TOKEN and config.SWITCHBOT_SECRET),
        "meters_count": len(data_store.devices),
        "is_rate_limited": time.time() < data_store.backoff_until,
        "backoff_remaining": max(0, int(data_store.backoff_until - time.time())),
        "last_api_call": data_store.last_api_call,
        "collection_interval": config.DATA_COLLECTION_INTERVAL,
    }


@router.get("/api/latency-logs")
async def get_latency_logs_endpoint(
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    endpoint: Optional[str] = None,
    device_id: Optional[str] = None,
    limit: int = 100,
):
    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00')) if start_time else None
    end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00')) if end_time else None

    logs = await get_latency_logs(
        start_time=start_dt,
        end_time=end_dt,
        endpoint=endpoint,
        device_id=device_id,
        limit=limit,
    )

    return {
        "logs": [log.model_dump() for log in logs],
        "count": len(logs),
    }


@router.get("/api/latency-stats")
async def get_latency_stats_endpoint(
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
):
    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00')) if start_time else None
    end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00')) if end_time else None

    stats = await get_latency_stats(start_time=start_dt, end_time=end_dt)
    return stats


@router.post("/api/import")
async def import_data(data: ImportData):
    imported_devices = 0
    imported_readings = 0

    for device_data in data.devices:
        device = MeterDevice(
            device_id=device_data.device_id,
            device_name=device_data.device_name,
            device_type=device_data.device_type,
            hub_device_id=device_data.hub_device_id,
            current_temperature=device_data.current_temperature,
            current_humidity=device_data.current_humidity,
            battery=device_data.battery,
            last_updated=datetime.fromisoformat(device_data.last_updated.replace('Z', '+00:00')) if device_data.last_updated else None,
        )

        data_store.devices[device.device_id] = device
        if device.device_id not in data_store.history:
            data_store.history[device.device_id] = []

        await save_device_to_db(device)
        imported_devices += 1

        for reading_data in device_data.readings:
            reading = MeterReading(
                timestamp=datetime.fromisoformat(reading_data.timestamp.replace('Z', '+00:00')),
                temperature=reading_data.temperature,
                humidity=reading_data.humidity,
                battery=reading_data.battery,
            )
            await save_reading_to_db(device.device_id, reading)
            imported_readings += 1

    return {
        "status": "ok",
        "imported_devices": imported_devices,
        "imported_readings": imported_readings,
    }


@router.get("/api/backup")
async def backup_database():
    if not os.path.exists(config.DB_PATH):
        raise HTTPException(status_code=404, detail="Database file not found")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"switchbot_backup_{timestamp}.db"

    return FileResponse(
        path=config.DB_PATH,
        filename=filename,
        media_type="application/x-sqlite3",
    )
