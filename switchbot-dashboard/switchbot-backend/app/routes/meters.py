import os
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.database import (
    DB_PATH,
    get_readings_from_db,
    save_device_to_db,
    save_reading_to_db,
)
from app.models import (
    DataStore,
    ImportData,
    MeterDevice,
    MeterReading,
    TimeScale,
)
import app.switchbot as switchbot_module
from app.switchbot import fetch_device_status, fetch_devices

router = APIRouter()


def get_data_store():
    from app.main import get_data_store as _get
    return _get()


@router.get("/api/meters")
async def get_meters(data_store: DataStore = Depends(get_data_store)):
    meters = list(data_store.devices.values())
    return {
        "meters": [meter.model_dump() for meter in meters],
        "last_updated": max(
            (m.last_updated for m in meters if m.last_updated),
            default=None,
        ),
    }


@router.get("/api/meters/{device_id}/history")
async def get_meter_history(
    device_id: str,
    time_scale: TimeScale = TimeScale.HOUR,
    data_store: DataStore = Depends(get_data_store),
):
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
async def refresh_meters(data_store: DataStore = Depends(get_data_store)):
    if not switchbot_module.SWITCHBOT_TOKEN or not switchbot_module.SWITCHBOT_SECRET:
        raise HTTPException(status_code=500, detail="SwitchBot credentials not configured")

    await collect_data(data_store)

    return {
        "status": "ok",
        "message": "Data collection triggered",
        "meters_count": len(data_store.devices),
    }


@router.post("/api/import")
async def import_data(data: ImportData, data_store: DataStore = Depends(get_data_store)):
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
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=404, detail="Database file not found")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"switchbot_backup_{timestamp}.db"

    return FileResponse(
        path=DB_PATH,
        filename=filename,
        media_type="application/x-sqlite3",
    )


async def collect_data(data_store: DataStore):
    if not switchbot_module.SWITCHBOT_TOKEN or not switchbot_module.SWITCHBOT_SECRET:
        return

    try:
        devices = await fetch_devices(data_store)

        for device in devices:
            if device.device_id not in data_store.devices:
                data_store.devices[device.device_id] = device
                data_store.history[device.device_id] = []
            else:
                data_store.devices[device.device_id].device_name = device.device_name
                data_store.devices[device.device_id].device_type = device.device_type

        for device_id in list(data_store.devices.keys()):
            try:
                status = await fetch_device_status(device_id, data_store)

                temperature = status.get("temperature")
                humidity = status.get("humidity")
                battery = status.get("battery")

                if temperature is not None:
                    now = datetime.now(timezone.utc)

                    data_store.devices[device_id].current_temperature = temperature
                    data_store.devices[device_id].current_humidity = humidity
                    data_store.devices[device_id].battery = battery
                    data_store.devices[device_id].last_updated = now

                    reading = MeterReading(
                        timestamp=now,
                        temperature=temperature,
                        humidity=humidity if humidity is not None else 0,
                        battery=battery,
                    )
                    data_store.history[device_id].append(reading)

                    await save_device_to_db(data_store.devices[device_id])
                    await save_reading_to_db(device_id, reading)

                    max_readings = 365 * 24 * 30
                    if len(data_store.history[device_id]) > max_readings:
                        data_store.history[device_id] = data_store.history[device_id][-max_readings:]

            except HTTPException as e:
                if e.status_code == 429:
                    break

    except HTTPException:
        pass
    except Exception:
        pass
