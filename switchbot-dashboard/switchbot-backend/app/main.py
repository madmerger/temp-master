import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import app.config as config
from app.api import router
from app.db import (
    cleanup_old_latency_logs,
    cleanup_old_readings,
    get_latency_logs,
    get_latency_stats,
    get_readings_from_db,
    init_database,
    load_devices_from_db,
    save_device_to_db,
    save_latency_log,
    save_reading_to_db,
)
from app.models import (
    DataStore,
    ImportData,
    ImportDeviceData,
    ImportReadingData,
    LatencyLog,
    MeterDevice,
    MeterReading,
    TimeScale,
    data_store,
)
from app.services import (
    background_collector,
    call_switchbot_api,
    collect_data,
    fetch_device_status,
    fetch_devices,
    generate_switchbot_headers,
)

# Re-export config values at module level for backward compatibility with tests
DB_PATH = config.DB_PATH
SWITCHBOT_TOKEN = config.SWITCHBOT_TOKEN
SWITCHBOT_SECRET = config.SWITCHBOT_SECRET
SWITCHBOT_API_BASE = config.SWITCHBOT_API_BASE
DATA_COLLECTION_INTERVAL = config.DATA_COLLECTION_INTERVAL
RATE_LIMIT_BACKOFF_BASE = config.RATE_LIMIT_BACKOFF_BASE
MAX_BACKOFF = config.MAX_BACKOFF
METER_DEVICE_TYPES = config.METER_DEVICE_TYPES


def _get_db_path():
    return config.DB_PATH


def _set_db_path(value):
    config.DB_PATH = value


# Allow tests to patch app.main.DB_PATH and have it affect config.DB_PATH
class _DBPathDescriptor:
    def __fspath__(self):
        return config.DB_PATH

    def __str__(self):
        return config.DB_PATH


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_database()
    await load_devices_from_db()

    if config.SWITCHBOT_TOKEN and config.SWITCHBOT_SECRET:
        data_store.collection_task = asyncio.create_task(background_collector())
    yield
    if data_store.collection_task:
        data_store.collection_task.cancel()
        try:
            await data_store.collection_task
        except asyncio.CancelledError:
            pass

    await cleanup_old_readings()
    await cleanup_old_latency_logs()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Serve frontend static files if the static directory exists.
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.is_dir():
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        file_path = (STATIC_DIR / full_path).resolve()
        if not file_path.is_relative_to(STATIC_DIR.resolve()):
            return FileResponse(STATIC_DIR / "index.html")
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
