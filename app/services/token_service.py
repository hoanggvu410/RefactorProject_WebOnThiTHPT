import redis.asyncio as redis


async def add_to_blacklist(r: redis.Redis, jti: str, ttl_seconds: int) -> None:
    key = f"blacklist:{jti}"
    await r.set(key, "true", ex=ttl_seconds)

async def is_blacklisted(r: redis.Redis, jti: str) -> bool:
    return await r.exists(f"blacklist:{jti}") == 1