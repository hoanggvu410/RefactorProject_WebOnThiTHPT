import json

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from jose import jwt, ExpiredSignatureError, JWTError
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core import redis
from app.core.redis import get_redis
from app.dependencies.db_dependency import get_db
from app.models.user_model import User
from app.services.auth_service import SECRET_KEY, ALGORITHM
from app.services.token_service import is_blacklisted

security = HTTPBearer()
#Decode token/ verify token
def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(401, {
                'code': "INVALID_TOKEN",
                'message': "Invalid token"
            })
        return payload
    except ExpiredSignatureError:
        raise HTTPException(401, {
            'code': "TOKEN_EXPIRED",
            'message': "Token has expired"
        })
    except JWTError:
        raise HTTPException(401, {
            'code': "INVALID_TOKEN",
            'message': "Invalid token"
        })

#
async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db),
        r: Redis = Depends(get_redis)
)-> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    
    jti = payload.get("jti")
    user_id = payload.get("user_id")

#kiem tra token co bi blacklist hay khong
    if await is_blacklisted(r, jti):
        raise HTTPException(401, {
            'code': "TOKEN_BLACKLISTED",
            'message': "Token has been revoked"
        })

#lay user tu redis 
    cache_key = f"cache:user:{user_id}"
    cached_user = await r.get(cache_key)

    #cache hit
    if cached_user:
        return User(**json.loads(cached_user))
    
    #cache miss -> query database
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(404, {
            'code': "USER_NOT_FOUND",
            'message': "User not found"
        })
    
#luu user vao redis voi thoi gian song 15 phut
    await r.set(cache_key, json.dumps({
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role
    }), ex=900)

    return user

def require_roles(*roles: str):
    def role_checker(
        current_user: User = Depends(get_current_user)
    ):
        if current_user.role not in roles:
            raise HTTPException(403, {
                "code": "FORBIDDEN",
                "message": "Permission denied"
            }
            )
        return current_user
    return role_checker

