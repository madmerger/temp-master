import asyncio

import app.config as config
from app.services.switchbot import collect_data


async def background_collector():
    while True:
        await collect_data()
        await asyncio.sleep(config.DATA_COLLECTION_INTERVAL)
