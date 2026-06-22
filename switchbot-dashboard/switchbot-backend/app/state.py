import asyncio
from typing import Optional

from app.models import MeterDevice, MeterReading


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
