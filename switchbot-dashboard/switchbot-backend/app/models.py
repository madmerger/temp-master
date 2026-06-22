from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


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


class ImportReadingData(BaseModel):
    timestamp: str
    temperature: float
    humidity: int
    battery: Optional[int] = None


class ImportDeviceData(BaseModel):
    device_id: str
    device_name: str
    device_type: str
    hub_device_id: Optional[str] = None
    current_temperature: Optional[float] = None
    current_humidity: Optional[int] = None
    battery: Optional[int] = None
    last_updated: Optional[str] = None
    readings: list[ImportReadingData] = []


class ImportData(BaseModel):
    devices: list[ImportDeviceData]
