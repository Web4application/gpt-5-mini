# backend/app/rate_limiter.py
import os
import redis
from fastapi import HTTPException

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)

def check_rate_limit(user_id: str, limit_per_minute: int = 30):
    key = f"rl:{user_id}:{int(__import__('time').time() // 60)}"
    cur = r.incr(key)
    if cur == 1:
        r.expire(key, 70)
    if cur > limit_per_minute:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
