import os

from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DB_PATH", "/data/app.db" if os.path.exists("/data") else "app.db")

SWITCHBOT_API_BASE = "https://api.switch-bot.com/v1.1"
SWITCHBOT_TOKEN = os.getenv("SWITCHBOT_TOKEN", "")
SWITCHBOT_SECRET = os.getenv("SWITCHBOT_SECRET", "")

DATA_COLLECTION_INTERVAL = 120
RATE_LIMIT_BACKOFF_BASE = 60
MAX_BACKOFF = 600

METER_DEVICE_TYPES = [
    "Meter",
    "MeterPlus",
    "WoIOSensor",
    "Meter Plus (JP)",
    "Meter Pro",
    "Meter Pro CO2",
    "Hub 2",
]
