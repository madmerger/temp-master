import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app import config
from app.database import save_device_to_db, save_reading_to_db
from app.models import ImportData, MeterDevice, MeterReading
from app.state import data_store

router = APIRouter()


@router.post("/api/import")
async def import_data(data: ImportData):
    """Import historical data from another backend instance."""
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
    """Download the SQLite database file for backup purposes."""
    if not os.path.exists(config.DB_PATH):
        raise HTTPException(status_code=404, detail="Database file not found")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"switchbot_backup_{timestamp}.db"

    return FileResponse(
        path=config.DB_PATH,
        filename=filename,
        media_type="application/x-sqlite3",
    )
