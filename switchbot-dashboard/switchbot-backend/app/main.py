import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.database import (
    DB_PATH,
    close_connection,
    cleanup_old_latency_logs,
    cleanup_old_readings,
    get_readings_from_db,
    init_database,
    load_devices_from_db,
    save_device_to_db,
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
)
from app.routes import meters, status
from app.routes.meters import collect_data
from app.switchbot import (
    METER_DEVICE_TYPES,
    MAX_BACKOFF,
    RATE_LIMIT_BACKOFF_BASE,
    SWITCHBOT_SECRET,
    SWITCHBOT_TOKEN,
    call_switchbot_api,
    fetch_device_status,
    fetch_devices,
    generate_switchbot_headers,
)

DATA_COLLECTION_INTERVAL = 120

data_store = DataStore()


def get_data_store() -> DataStore:
    return data_store


async def background_collector():
    while True:
        await collect_data(data_store)
        await asyncio.sleep(DATA_COLLECTION_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_database()
    await load_devices_from_db(data_store)

    if SWITCHBOT_TOKEN and SWITCHBOT_SECRET:
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
    await close_connection()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meters.router)
app.include_router(status.router)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


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
