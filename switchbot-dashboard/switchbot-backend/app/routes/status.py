import time
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends

from app.database import get_latency_logs, get_latency_stats
from app.models import DataStore
import app.switchbot as switchbot_module

DATA_COLLECTION_INTERVAL = 120

router = APIRouter()


def get_data_store():
    from app.main import get_data_store as _get
    return _get()


@router.get("/api/status")
async def get_status(data_store: DataStore = Depends(get_data_store)):
    return {
        "configured": bool(switchbot_module.SWITCHBOT_TOKEN and switchbot_module.SWITCHBOT_SECRET),
        "meters_count": len(data_store.devices),
        "is_rate_limited": time.time() < data_store.backoff_until,
        "backoff_remaining": max(0, int(data_store.backoff_until - time.time())),
        "last_api_call": data_store.last_api_call,
        "collection_interval": DATA_COLLECTION_INTERVAL,
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
