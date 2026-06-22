import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app import config
from app.collector import background_collector
from app.database import (
    cleanup_old_latency_logs,
    cleanup_old_readings,
    init_database,
    load_devices_from_db,
)
from app.routes import data, latency, meters, status
from app.state import data_store


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

app.include_router(status.router)
app.include_router(meters.router)
app.include_router(latency.router)
app.include_router(data.router)

# Serve frontend static files if the static directory exists.
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.is_dir():
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Serve the frontend at root."""
        file_path = (STATIC_DIR / full_path).resolve()
        if not file_path.is_relative_to(STATIC_DIR.resolve()):
            return FileResponse(STATIC_DIR / "index.html")
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
