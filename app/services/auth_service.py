import hashlib
from uuid import uuid4
from jose import jwt
from datetime import timedelta, datetime
from fastapi import HTTPException
from passlib.context import CryptContext
from app.dependencies.auth_dependency import decode_access_token
from app.models.user_model import User
from app.models.refresh_token_model import RefreshToken
from app.services.token_service import add_to_blacklist
from config import get_settings

#JWT
settings = get_settings()
SECRET_KEY = settings.SECRET_KEY
REFRESH_SECRET_KEY = settings.REFRESH_SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

#Tao token
def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode.update({"jti": str(uuid4())})
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    to_encode.update({"iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

#hash password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):

    return pwd_context.hash(password)

def  verify_password(plain_password, hashed_password):

    return pwd_context.verify(plain_password, hashed_password)

#hash token
def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

#register
def register(db, data):
    # kiem tra xem user da ton tai
    user = db.query(User).filter(User.username == data.username).first()

    if user:
        raise HTTPException(400, {
            'code': "USER_ALREADY_EXISTS",
            'message': "User already exists"
        })
    # tao user moi
    new_user = User(
        name =  data.name,
        username = data.username,
        password = hash_password(data.password),
        email = data.email,
        grade = data.grade
    )
    db.add(new_user)
    db.commit()
    return {"message": "user created successfully"}

#login
def login(db, data):
    user = db.query(User).filter(User.username == data.username).first()

    if not user:
        raise HTTPException(404, {
            'code': "USER_NOT_FOUND",
            'message': "User not found"
        })
    if not verify_password(data.password, user.password):
        raise HTTPException(401, {
            'code': "INCORRECT_PASSWORD",
            'message': "Incorrect password"
        })
    access_token = create_access_token(data={
        "sub": user.username,
        "role": user.role,
        "user_id": user.user_id,
        "user_uuid": str(user.uuid)
    })
    refresh_token = create_refresh_token(data={
        "sub": user.username
    })

#luu refresh token vao db
    db_token = RefreshToken(
        user_id=user.user_id,
        hashed_token=hash_token(refresh_token),
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_token)
    db.commit()

    return {
        "message": "Login successfully",
        "access_token": access_token,
        "refresh_token": refresh_token
    }

#refresh
def refresh_token(db, data):
    token_hash = hash_token(data.refresh_token)
    token_record = db.query(RefreshToken).filter(RefreshToken.hashed_token == token_hash).first()
    if not token_record:
        raise HTTPException(401, {
            'code': "INVALID_REFRESH_TOKEN",
            'message': "Invalid refresh token"
        })
    if token_record.is_revoked:
        raise HTTPException(401, {
        'code': "REFRESH_TOKEN_REVOKED",
        'message': "Refresh token has been revoked"
        })
    new_access_token = create_access_token(data={"sub": token_record.user.username})
    return {"access_token": new_access_token, "token_type": "bearer"}

#logout
async def logout(data, credentials, redis_client, db):
#lay payload tu token
    payload = decode_access_token(credentials.credentials)
    jti = payload.get("jti")

#blacklist token
    ttl = max(payload.get("exp") - int(datetime.utcnow().timestamp()), 1)
    await add_to_blacklist(redis_client, jti, ttl)

#revoke refresh token
    token_hash = hash_token(data.refresh_token)
    token_record = db.query(RefreshToken).filter(RefreshToken.hashed_token == token_hash).first()
    if not token_record:
        raise HTTPException(401, {
            'code': "INVALID_REFRESH_TOKEN",
            'message': "Invalid refresh token"
        })
    if token_record.is_revoked:
        raise HTTPException(401, {
        'code': "REFRESH_TOKEN_REVOKED",
        'message': "Refresh token has been revoked"
        })
    token_record.is_revoked = True
    db.commit()

    return {"message": "Logout successfully"}

#change password
def change_password(db, current_user, data):
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not verify_password(data.current_password, user.password):
        raise HTTPException(401, {
            'code': "INCORRECT_CURRENT_PASSWORD",
            'message': "Incorrect current password"
        })
    user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
