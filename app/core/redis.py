import redis.asyncio as redis

from config import Settings

Settings = Settings() 

redis_pool =redis.ConnectionPool.from_url(
    Settings.redis_url,
    decode_responses=True,
    max_connections=20
)

def get_redis() -> redis.Redis:
    return redis.Redis(connection_pool=redis_pool)