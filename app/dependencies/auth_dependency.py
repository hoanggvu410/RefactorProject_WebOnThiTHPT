import json

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core.redis import get_redis
from app.dependencies.db_dependency import get_db
from app.models.user_model import User
from app.services.auth_service import decode_access_token
from app.services.token_service import is_blacklisted

security = HTTPBearer()

#get current user tu token
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

#query user tu db luon
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(404, {
            'code': "USER_NOT_FOUND",
            'message': "User not found"
        })

    return user

#check role
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

