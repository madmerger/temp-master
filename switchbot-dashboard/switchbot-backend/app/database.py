import os
from datetime import datetime, timezone
from typing import Optional

import aiosqlite

from app.models import DataStore, LatencyLog, MeterDevice, MeterReading

DB_PATH = os.getenv("DB_PATH", "/data/app.db" if os.path.exists("/data") else "app.db")

_connection: Optional[aiosqlite.Connection] = None


async def get_connection() -> aiosqlite.Connection:
    global _connection
    if _connection is None:
        _connection = await aiosqlite.connect(DB_PATH)
        _connection.row_factory = aiosqlite.Row
    return _connection


async def close_connection():
    global _connection
    if _connection is not None:
        await _connection.close()
        _connection = None


async def init_database():
    db = await get_connection()
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


async def load_devices_from_db(data_store: DataStore):
    db = await get_connection()
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
    db = await get_connection()
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
    db = await get_connection()
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
    cutoff_dt = datetime.fromtimestamp(cutoff_timestamp, tz=timezone.utc)
    readings = []
    db = await get_connection()
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
    cutoff = datetime.now(timezone.utc).timestamp() - 31536000  # 1 year
    cutoff_dt = datetime.fromtimestamp(cutoff, tz=timezone.utc)
    db = await get_connection()
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
    timestamp = datetime.now(timezone.utc)
    db = await get_connection()
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

    db = await get_connection()
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

    db = await get_connection()
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
    cutoff = datetime.now(timezone.utc).timestamp() - 2592000  # 30 days
    cutoff_dt = datetime.fromtimestamp(cutoff, tz=timezone.utc)
    db = await get_connection()
    await db.execute("DELETE FROM latency_logs WHERE timestamp < ?", (cutoff_dt.isoformat(),))
    await db.commit()
