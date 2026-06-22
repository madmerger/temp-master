from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app import config
from app.collector import collect_data
from app.database import get_readings_from_db
from app.models import TimeScale
from app.state import data_store

router = APIRouter()


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
