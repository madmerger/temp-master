import asyncio
from datetime import datetime, timezone

from fastapi import HTTPException

from app import config
from app.database import save_device_to_db, save_reading_to_db
from app.models import MeterReading
from app.state import data_store
from app.switchbot_client import fetch_device_status, fetch_devices


async def collect_data():
    if not config.SWITCHBOT_TOKEN or not config.SWITCHBOT_SECRET:
        return

    try:
        devices = await fetch_devices()

        for device in devices:
            if device.device_id not in data_store.devices:
                data_store.devices[device.device_id] = device
                data_store.history[device.device_id] = []
            else:
                data_store.devices[device.device_id].device_name = device.device_name
                data_store.devices[device.device_id].device_type = device.device_type

        for device_id in list(data_store.devices.keys()):
            try:
                status = await fetch_device_status(device_id)

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


async def background_collector():
    while True:
        await collect_data()
        await asyncio.sleep(config.DATA_COLLECTION_INTERVAL)
