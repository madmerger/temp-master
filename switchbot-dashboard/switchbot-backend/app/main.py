import asyncio
import base64
import hashlib
import hmac
import logging
import math
import os
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional

import aiosqlite
import httpx
from dotenv import load_dotenv
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator, model_validator
from starlette.background import BackgroundTask

from app.alerts import post_error_alert

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("temp_master")

# Database path - use /data/app.db for persistent volume in production
DB_PATH = os.getenv("DB_PATH", "/data/app.db" if os.path.exists("/data") else "app.db")

SWITCHBOT_API_BASE = "https://api.switch-bot.com/v1.1"
SWITCHBOT_TOKEN = os.getenv("SWITCHBOT_TOKEN", "")
SWITCHBOT_SECRET = os.getenv("SWITCHBOT_SECRET", "")
IMPORT_API_TOKEN = os.getenv("IMPORT_API_TOKEN", "")
MAX_IMPORT_DEVICES = 100
MAX_IMPORT_READINGS = 10000
MAX_IMPORT_BODY_BYTES = 5 * 1024 * 1024
IMPORT_MAX_CLOCK_SKEW_SECONDS = 300
DEVICE_ID_PATTERN = r"^[A-Za-z0-9-]{1,64}$"

DATA_COLLECTION_INTERVAL = 3600
RATE_LIMIT_BACKOFF_BASE = 60
MAX_BACKOFF = 600

METER_DEVICE_TYPES = ["Meter", "MeterPlus", "WoIOSensor", "Meter Plus (JP)", "Meter Pro", "Meter Pro CO2", "Hub 2"]


class TimeScale(str, Enum):
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"


class MeterReading(BaseModel):
    timestamp: datetime
    temperature: float
    humidity: int
    battery: Optional[int] = None


class MeterDevice(BaseModel):
    device_id: str
    device_name: str
    device_type: str
    hub_device_id: Optional[str] = None
    current_temperature: Optional[float] = None
    current_humidity: Optional[int] = None
    battery: Optional[int] = None
    last_updated: Optional[datetime] = None


class LatencyLog(BaseModel):
    id: Optional[int] = None
    endpoint: str
    device_id: Optional[str] = None
    timestamp: datetime
    latency_ms: float
    status_code: int
    success: bool
    error_message: Optional[str] = None


class DataStore:
    def __init__(self):
        self.devices: dict[str, MeterDevice] = {}
        self.history: dict[str, list[MeterReading]] = {}
        self.last_api_call: float = 0
        self.backoff_until: float = 0
        self.consecutive_errors: int = 0
        self.is_collecting: bool = False
        self.collection_task: Optional[asyncio.Task] = None
        self.db_initialized: bool = False


data_store = DataStore()


async def init_database():
    """Initialize SQLite database with required tables."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS devices (
                device_id TEXT PRIMARY KEY,
                device_name TEXT NOT NULL,
                device_type TEXT NOT NULL,
                hub_device_id TEXT,
                current_temperature REAL,
                current_humidity INTEGER,
                battery INTEGER,
                last_updated TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                temperature REAL NOT NULL,
                humidity INTEGER NOT NULL,
                battery INTEGER,
                FOREIGN KEY (device_id) REFERENCES devices(device_id)
            )
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_readings_device_timestamp 
            ON readings(device_id, timestamp)
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS latency_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                endpoint TEXT NOT NULL,
                device_id TEXT,
                timestamp TEXT NOT NULL,
                latency_ms REAL NOT NULL,
                status_code INTEGER NOT NULL,
                success INTEGER NOT NULL,
                error_message TEXT
            )
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_latency_logs_timestamp 
            ON latency_logs(timestamp)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_latency_logs_endpoint 
            ON latency_logs(endpoint)
        """)
        await db.commit()
    data_store.db_initialized = True


async def load_devices_from_db():
    """Load devices from database into memory cache."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM devices") as cursor:
            async for row in cursor:
                device = MeterDevice(
                    device_id=row["device_id"],
                    device_name=row["device_name"],
                    device_type=row["device_type"],
                    hub_device_id=row["hub_device_id"],
                    current_temperature=row["current_temperature"],
                    current_humidity=row["current_humidity"],
                    battery=row["battery"],
                    last_updated=datetime.fromisoformat(row["last_updated"]) if row["last_updated"] else None,
                )
                data_store.devices[device.device_id] = device
                data_store.history[device.device_id] = []


async def save_device_to_db(device: MeterDevice):
    """Save or update a device in the database."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT OR REPLACE INTO devices 
            (device_id, device_name, device_type, hub_device_id, current_temperature, current_humidity, battery, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            device.device_id,
            device.device_name,
            device.device_type,
            device.hub_device_id,
            device.current_temperature,
            device.current_humidity,
            device.battery,
            device.last_updated.isoformat() if device.last_updated else None,
        ))
        await db.commit()


async def save_reading_to_db(device_id: str, reading: MeterReading):
    """Save a reading to the database."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO readings (device_id, timestamp, temperature, humidity, battery)
            VALUES (?, ?, ?, ?, ?)
        """, (
            device_id,
            reading.timestamp.isoformat(),
            reading.temperature,
            reading.humidity,
            reading.battery,
        ))
        await db.commit()


async def get_readings_from_db(device_id: str, cutoff_timestamp: float) -> list[MeterReading]:
    """Get readings from database after a cutoff timestamp."""
    cutoff_dt = datetime.fromtimestamp(cutoff_timestamp, tz=timezone.utc)
    readings = []
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT * FROM readings 
            WHERE device_id = ? AND timestamp >= ?
            ORDER BY timestamp ASC
        """, (device_id, cutoff_dt.isoformat())) as cursor:
            async for row in cursor:
                reading = MeterReading(
                    timestamp=datetime.fromisoformat(row["timestamp"]),
                    temperature=row["temperature"],
                    humidity=row["humidity"],
                    battery=row["battery"],
                )
                readings.append(reading)
    return readings


async def cleanup_old_readings():
    """Remove readings older than 1 year to prevent database bloat."""
    cutoff = datetime.now(timezone.utc).timestamp() - 31536000  # 1 year
    cutoff_dt = datetime.fromtimestamp(cutoff, tz=timezone.utc)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM readings WHERE timestamp < ?", (cutoff_dt.isoformat(),))
        await db.commit()


async def save_latency_log(
    endpoint: str,
    latency_ms: float,
    status_code: int,
    success: bool,
    device_id: Optional[str] = None,
    error_message: Optional[str] = None,
):
    """Save a latency log entry to the database."""
    timestamp = datetime.now(timezone.utc)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO latency_logs (endpoint, device_id, timestamp, latency_ms, status_code, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            endpoint,
            device_id,
            timestamp.isoformat(),
            latency_ms,
            status_code,
            1 if success else 0,
            error_message,
        ))
        await db.commit()


async def get_latency_logs(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    endpoint: Optional[str] = None,
    device_id: Optional[str] = None,
    limit: int = 100,
) -> list[LatencyLog]:
    """Get latency logs from the database with optional filters."""
    logs = []
    query = "SELECT * FROM latency_logs WHERE 1=1"
    params: list = []
    
    if start_time:
        query += " AND timestamp >= ?"
        params.append(start_time.isoformat())
    if end_time:
        query += " AND timestamp <= ?"
        params.append(end_time.isoformat())
    if endpoint:
        query += " AND endpoint = ?"
        params.append(endpoint)
    if device_id:
        query += " AND device_id = ?"
        params.append(device_id)
    
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            async for row in cursor:
                log = LatencyLog(
                    id=row["id"],
                    endpoint=row["endpoint"],
                    device_id=row["device_id"],
                    timestamp=datetime.fromisoformat(row["timestamp"]),
                    latency_ms=row["latency_ms"],
                    status_code=row["status_code"],
                    success=bool(row["success"]),
                    error_message=row["error_message"],
                )
                logs.append(log)
    return logs


async def get_latency_stats(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
) -> dict:
    """Get aggregated latency statistics."""
    query = """
        SELECT 
            COUNT(*) as total_calls,
            AVG(latency_ms) as avg_latency,
            MIN(latency_ms) as min_latency,
            MAX(latency_ms) as max_latency,
            SUM(success) as successful_calls
        FROM latency_logs WHERE 1=1
    """
    params: list = []
    
    if start_time:
        query += " AND timestamp >= ?"
        params.append(start_time.isoformat())
    if end_time:
        query += " AND timestamp <= ?"
        params.append(end_time.isoformat())
    
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            row = await cursor.fetchone()
            if row:
                total_calls = row["total_calls"] or 0
                successful_calls = row["successful_calls"] or 0
                return {
                    "total_calls": total_calls,
                    "avg_latency_ms": row["avg_latency"],
                    "min_latency_ms": row["min_latency"],
                    "max_latency_ms": row["max_latency"],
                    "successful_calls": successful_calls,
                    "failed_calls": total_calls - successful_calls,
                    "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
                }
    return {
        "total_calls": 0,
        "avg_latency_ms": None,
        "min_latency_ms": None,
        "max_latency_ms": None,
        "successful_calls": 0,
        "failed_calls": 0,
        "success_rate": 0,
    }


async def cleanup_old_latency_logs():
    """Remove latency logs older than 30 days to prevent database bloat."""
    cutoff = datetime.now(timezone.utc).timestamp() - 2592000  # 30 days
    cutoff_dt = datetime.fromtimestamp(cutoff, tz=timezone.utc)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM latency_logs WHERE timestamp < ?", (cutoff_dt.isoformat(),))
        await db.commit()


def generate_switchbot_headers() -> dict:
    if not SWITCHBOT_TOKEN or not SWITCHBOT_SECRET:
        return {}
    
    nonce = str(uuid.uuid4())
    t = int(round(time.time() * 1000))
    string_to_sign = f"{SWITCHBOT_TOKEN}{t}{nonce}"
    
    string_to_sign_bytes = bytes(string_to_sign, "utf-8")
    secret_bytes = bytes(SWITCHBOT_SECRET, "utf-8")
    
    sign = base64.b64encode(
        hmac.new(secret_bytes, msg=string_to_sign_bytes, digestmod=hashlib.sha256).digest()
    )
    
    return {
        "Authorization": SWITCHBOT_TOKEN,
        "Content-Type": "application/json",
        "charset": "utf8",
        "t": str(t),
        "sign": str(sign, "utf-8"),
        "nonce": nonce,
    }


async def call_switchbot_api(endpoint: str, device_id: Optional[str] = None) -> dict:
    if time.time() < data_store.backoff_until:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limited. Retry after {int(data_store.backoff_until - time.time())} seconds",
        )
    
    headers = generate_switchbot_headers()
    if not headers:
        raise HTTPException(status_code=500, detail="SwitchBot credentials not configured")
    
    start_time = time.perf_counter()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{SWITCHBOT_API_BASE}{endpoint}", headers=headers)
            end_time = time.perf_counter()
            latency_ms = (end_time - start_time) * 1000
            data_store.last_api_call = time.time()
            
            if response.status_code == 429:
                data_store.consecutive_errors += 1
                backoff_time = min(
                    RATE_LIMIT_BACKOFF_BASE * (2 ** data_store.consecutive_errors),
                    MAX_BACKOFF,
                )
                data_store.backoff_until = time.time() + backoff_time
                await save_latency_log(
                    endpoint=endpoint,
                    latency_ms=latency_ms,
                    status_code=429,
                    success=False,
                    device_id=device_id,
                    error_message=f"Rate limited. Backing off for {backoff_time} seconds",
                )
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limited by SwitchBot API. Backing off for {backoff_time} seconds",
                )
            
            if response.status_code != 200:
                await save_latency_log(
                    endpoint=endpoint,
                    latency_ms=latency_ms,
                    status_code=response.status_code,
                    success=False,
                    device_id=device_id,
                    error_message=f"SwitchBot API error: {response.text}",
                )
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"SwitchBot API error: {response.text}",
                )
            
            await save_latency_log(
                endpoint=endpoint,
                latency_ms=latency_ms,
                status_code=200,
                success=True,
                device_id=device_id,
            )
            data_store.consecutive_errors = 0
            return response.json()
            
        except httpx.RequestError as e:
            end_time = time.perf_counter()
            latency_ms = (end_time - start_time) * 1000
            await save_latency_log(
                endpoint=endpoint,
                latency_ms=latency_ms,
                status_code=500,
                success=False,
                device_id=device_id,
                error_message=f"Request error: {str(e)}",
            )
            raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")


async def fetch_devices() -> list[MeterDevice]:
    response = await call_switchbot_api("/devices")
    
    if response.get("statusCode") != 100:
        raise HTTPException(
            status_code=500,
            detail=f"SwitchBot API returned error: {response.get('message', 'Unknown error')}",
        )
    
    devices = []
    device_list = response.get("body", {}).get("deviceList", [])
    
    for device in device_list:
        device_type = device.get("deviceType", "")
        if device_type in METER_DEVICE_TYPES:
            meter = MeterDevice(
                device_id=device.get("deviceId", ""),
                device_name=device.get("deviceName", "Unknown"),
                device_type=device_type,
                hub_device_id=device.get("hubDeviceId"),
            )
            devices.append(meter)
    
    return devices


async def fetch_device_status(device_id: str) -> dict:
    response = await call_switchbot_api(f"/devices/{device_id}/status", device_id=device_id)
    
    if response.get("statusCode") != 100:
        raise HTTPException(
            status_code=500,
            detail=f"SwitchBot API returned error: {response.get('message', 'Unknown error')}",
        )
    
    return response.get("body", {})


async def collect_data():
    if not SWITCHBOT_TOKEN or not SWITCHBOT_SECRET:
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
                    
                    # Save to database for persistence
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
        await asyncio.sleep(DATA_COLLECTION_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and load existing data
    await init_database()
    await load_devices_from_db()
    
    if SWITCHBOT_TOKEN and SWITCHBOT_SECRET:
        data_store.collection_task = asyncio.create_task(background_collector())
    yield
    if data_store.collection_task:
        data_store.collection_task.cancel()
        try:
            await data_store.collection_task
        except asyncio.CancelledError:
            pass
    
    # Cleanup old data periodically (on shutdown)
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

_background_tasks: set = set()


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request_id = uuid.uuid4().hex[:12]
    start_time = time.perf_counter()
    response = _import_body_size_error(request)
    try:
        if response is None:
            response = await call_next(request)
    except Exception:
        logger.exception(
            "Unhandled error request_id=%s method=%s path=%s",
            request_id,
            request.method,
            request.url.path,
        )
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "request_id": request_id},
        )
    latency_ms = (time.perf_counter() - start_time) * 1000
    response.headers["X-Request-ID"] = request_id
    if response.status_code >= 500 and request.url.path.startswith("/api/"):
        task = asyncio.create_task(
            post_error_alert(
                request.method,
                request.url.path,
                response.status_code,
                latency_ms,
                request_id,
            )
        )
        _background_tasks.add(task)
        task.add_done_callback(_background_tasks.discard)
    return response


def _import_body_size_error(request: Request) -> Optional[JSONResponse]:
    if request.method != "POST" or request.url.path != "/api/import":
        return None

    content_length = request.headers.get("content-length")
    if content_length is None:
        return JSONResponse(status_code=411, content={"detail": "Content-Length required"})
    try:
        body_size = int(content_length)
    except ValueError:
        return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})
    if body_size < 0:
        return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})
    if body_size > MAX_IMPORT_BODY_BYTES:
        return JSONResponse(status_code=413, content={"detail": "Import payload too large"})
    return None


def _sanitize_validation_error(value):
    if isinstance(value, float) and not math.isfinite(value):
        return str(value)
    if isinstance(value, dict):
        return {
            key: _sanitize_validation_error(nested_value)
            for key, nested_value in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [_sanitize_validation_error(nested_value) for nested_value in value]
    return value


@app.exception_handler(RequestValidationError)
async def request_validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": jsonable_encoder(_sanitize_validation_error(exc.errors()))},
    )


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/meters")
async def get_meters():
    meters = list(data_store.devices.values())
    return {
        "meters": [meter.model_dump() for meter in meters],
        "last_updated": max(
            (m.last_updated for m in meters if m.last_updated),
            default=None,
        ),
    }


@app.get("/api/meters/{device_id}/history")
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
    
    # Read from database for persistent history
    filtered_history = await get_readings_from_db(device_id, cutoff)
    
    return {
        "device_id": device_id,
        "time_scale": time_scale,
        "history": [reading.model_dump() for reading in filtered_history],
        "device": data_store.devices.get(device_id).model_dump() if device_id in data_store.devices else None,
    }


@app.post("/api/meters/refresh")
async def refresh_meters():
    if not SWITCHBOT_TOKEN or not SWITCHBOT_SECRET:
        raise HTTPException(status_code=500, detail="SwitchBot credentials not configured")
    
    await collect_data()
    
    return {
        "status": "ok",
        "message": "Data collection triggered",
        "meters_count": len(data_store.devices),
    }


@app.get("/api/status")
async def get_status():
    return {
        "configured": bool(SWITCHBOT_TOKEN and SWITCHBOT_SECRET),
        "meters_count": len(data_store.devices),
        "is_rate_limited": time.time() < data_store.backoff_until,
        "backoff_remaining": max(0, int(data_store.backoff_until - time.time())),
        "last_api_call": data_store.last_api_call,
        "collection_interval": DATA_COLLECTION_INTERVAL,
    }


@app.get("/api/latency-logs")
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


@app.get("/api/latency-stats")
async def get_latency_stats_endpoint(
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
):
    """Get aggregated latency statistics."""
    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00')) if start_time else None
    end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00')) if end_time else None
    
    stats = await get_latency_stats(start_time=start_dt, end_time=end_dt)
    return stats


def _normalize_import_timestamp(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        value = value.replace(tzinfo=timezone.utc)
    normalized = value.astimezone(timezone.utc)
    if normalized > datetime.now(timezone.utc) + timedelta(
        seconds=IMPORT_MAX_CLOCK_SKEW_SECONDS
    ):
        raise ValueError("timestamp must not be in the future")
    return normalized


class ImportReadingData(BaseModel):
    timestamp: datetime
    temperature: float = Field(allow_inf_nan=False, ge=-100, le=150)
    humidity: int = Field(ge=0, le=100)
    battery: Optional[int] = Field(default=None, ge=0, le=100)

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, value: datetime) -> datetime:
        return _normalize_import_timestamp(value)


class ImportDeviceData(BaseModel):
    device_id: str = Field(pattern=DEVICE_ID_PATTERN)
    device_name: str = Field(min_length=1, max_length=100)
    device_type: str = Field(min_length=1, max_length=64)
    hub_device_id: Optional[str] = Field(default=None, pattern=DEVICE_ID_PATTERN)
    current_temperature: Optional[float] = Field(
        default=None, allow_inf_nan=False, ge=-100, le=150
    )
    current_humidity: Optional[int] = Field(default=None, ge=0, le=100)
    battery: Optional[int] = Field(default=None, ge=0, le=100)
    last_updated: Optional[datetime] = None
    readings: list[ImportReadingData] = Field(
        default_factory=list, max_length=MAX_IMPORT_READINGS
    )

    @field_validator("last_updated")
    @classmethod
    def validate_last_updated(cls, value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return None
        return _normalize_import_timestamp(value)


class ImportData(BaseModel):
    devices: list[ImportDeviceData] = Field(max_length=MAX_IMPORT_DEVICES)

    @model_validator(mode="after")
    def validate_total_readings(self) -> "ImportData":
        total_readings = sum(len(device.readings) for device in self.devices)
        if total_readings > MAX_IMPORT_READINGS:
            raise ValueError(f"at most {MAX_IMPORT_READINGS} readings are allowed")
        return self


async def require_import_token(
    authorization: Optional[str] = Header(default=None),
) -> None:
    import_api_token = IMPORT_API_TOKEN
    if not import_api_token:
        raise HTTPException(status_code=503, detail="Import is disabled")

    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing import token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    scheme, separator, token = authorization.partition(" ")
    if (
        not separator
        or scheme.lower() != "bearer"
        or not token
        or any(character.isspace() for character in token)
        or not hmac.compare_digest(token.encode(), import_api_token.encode())
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing import token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.post("/api/import", dependencies=[Depends(require_import_token)])
async def import_data(data: ImportData):
    """Import historical data from another backend instance."""
    imported_devices = 0
    imported_readings = 0
    
    for device_data in data.devices:
        # Create or update device
        device = MeterDevice(
            device_id=device_data.device_id,
            device_name=device_data.device_name,
            device_type=device_data.device_type,
            hub_device_id=device_data.hub_device_id,
            current_temperature=device_data.current_temperature,
            current_humidity=device_data.current_humidity,
            battery=device_data.battery,
            last_updated=device_data.last_updated,
        )
        
        data_store.devices[device.device_id] = device
        if device.device_id not in data_store.history:
            data_store.history[device.device_id] = []
        
        await save_device_to_db(device)
        imported_devices += 1
        
        # Import readings
        for reading_data in device_data.readings:
            reading = MeterReading(
                timestamp=reading_data.timestamp,
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


BACKUP_DIR = os.getenv("BACKUP_DIR", os.path.join(os.path.dirname(os.path.abspath(DB_PATH)), "backups"))


@app.get("/api/backup")
async def backup_database():
    """Download a consistent snapshot of the SQLite database."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=404, detail="Database file not found")
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"switchbot_backup_{timestamp}.db"
    snapshot_path = os.path.join(BACKUP_DIR, filename)
    async with aiosqlite.connect(DB_PATH) as src, aiosqlite.connect(snapshot_path) as dst:
        await src.backup(dst)
    return FileResponse(path=snapshot_path, filename=filename, media_type="application/x-sqlite3",
                        background=BackgroundTask(os.remove, snapshot_path))


# Serve frontend static files if the static directory exists.
# Layout under static/:
#   index.html              -> frontend served at "/"
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
