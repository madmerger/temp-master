from datetime import datetime
from typing import Optional

from fastapi import APIRouter

from app.database import get_latency_logs, get_latency_stats

router = APIRouter()


@router.get("/api/latency-logs")
async def get_latency_logs_endpoint(
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    endpoint: Optional[str] = None,
    device_id: Optional[str] = None,
    limit: int = 100,
):
    """Get latency logs for API calls with optional filters."""
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
    """Get aggregated latency statistics."""
    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00')) if start_time else None
    end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00')) if end_time else None

    stats = await get_latency_stats(start_time=start_dt, end_time=end_dt)
    return stats
