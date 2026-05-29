from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from jose import jwt, ExpiredSignatureError, JWTError

from app.services.auth_service import SECRET_KEY, ALGORITHM

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
def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
)-> dict:
    token = credentials.credentials
    payload = decode_access_token(token)
    return payload

def require_roles(roles: list[str]):
    def role_checker(
        current_user: dict = Depends(get_current_user)
    ):
        if current_user.get("role") not in roles:
            raise HTTPException(403, {
                "code": "FORBIDDEN",
                "message": "Permission denied"
            }
            )
        return current_user
    return role_checker


