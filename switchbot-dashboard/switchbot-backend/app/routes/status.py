import time

from fastapi import APIRouter

from app import config
from app.state import data_store

router = APIRouter()


@router.get("/healthz")
async def healthz():
    return {"status": "ok"}


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
