import hashlib
import random
import secrets
from urllib.parse import quote
from uuid import uuid4
from jose import ExpiredSignatureError, JWTError, jwt
from datetime import timedelta, datetime
from fastapi import HTTPException
from passlib.context import CryptContext
from app.models.user_model import User
from app.models.refresh_token_model import RefreshToken
from app.services.token_service import add_to_blacklist
from app.tasks.mail_tasks import send_otp_email_task, send_verify_email_task
from config import get_settings

#JWT
settings = get_settings()

#Tao token
def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode.update({"jti": str(uuid4())})
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    to_encode.update({"iat": datetime.utcnow()})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.refresh_secret_key, algorithm=settings.algorithm)

#Decode token/ verify token
def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=settings.algorithm)
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
        expires_at=datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    )
    db.add(db_token)
    db.commit()

    return {
        "message": "Login successfully",
        "access_token": access_token,
        "refresh_token": refresh_token
    }

#refresh
def refresh_access_token(db, data):
    #tim refresh token trong db
    token_hash = hash_token(data.refresh_token)
    token_record = db.query(RefreshToken).filter(RefreshToken.hashed_token == token_hash).first()

    #check token ton tai kh
    if not token_record:
        raise HTTPException(401, {
            'code': "INVALID_REFRESH_TOKEN",
            'message': "Invalid refresh token"
        })
    
    #Check token is_revoked
    if token_record.is_revoked:
        raise HTTPException(401, {
        'code': "REFRESH_TOKEN_REVOKED",
        'message': "Refresh token has been revoked"
        })
    
    #check token expire
    if token_record.expires_at < datetime.utcnow():
        raise HTTPException(401, {
            "code":"REFRESH_TOKEN_EXPIRED",
            "message": "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại"
        })

    new_access_token = create_access_token(data={
        "sub": token_record.user.username,
        "role": token_record.user.role,
        "user_id": token_record.user.user_id,
        "user_uuid": str(token_record.user.uuid)
    })
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

EMAIL_VERIFY_PREFIX = "email_verify:"
PASSWORD_RESET_PREFIX = "password_reset_otp:"

async def send_verify_email(db, current_user, redis_client):
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(404, {
            "code": "USER_NOT_FOUND",
            "message": "User not found"
        })
    
    verify_token = secrets.token_urlsafe(32)
    redis_key = f"{EMAIL_VERIFY_PREFIX}{verify_token}"
    ttl_seconds = settings.email_verify_expire_minutes * 60

    await redis_client.setex(redis_key, ttl_seconds, str(user.user_id))

    verify_link = f"{settings.frontend_url}/#/verify-email?token={quote(verify_token, safe='')}"

    send_verify_email_task.delay(user.email, verify_link)
    
    return {"message": "da gui email xac thuc"}

async def verify_email(db, data, redis_client):
    redis_key = f"{EMAIL_VERIFY_PREFIX}{data.token}"
    user_id = await redis_client.get(redis_key)

    if isinstance(user_id, bytes):
        user_id = user_id.decode("utf-8")

    if not user_id:
        raise HTTPException(400, {
            "code": "INVALID_OR_EXPIRED_VERIFY_TOKEN",
            "message": "Link xác thực không hợp lệ hoặc đã hết hạn"
        })

    user = db.query(User).filter(User.user_id == int(user_id)).first()
    if not user:
        raise HTTPException(404, {
            "code": "USER_NOT_FOUND",
            "message": "User not found"
        })

    user.email_verified = True
    db.commit()

    await redis_client.delete(redis_key)

    return {"message": "Xác thực email thành công"}

async def forgot_password(db, data, redis_client):
    user = db.query(User).filter(User.email == data.email).first()

    if not user: 
        raise HTTPException(400, {
            "code": "USER_UNKOWN",
            "message": "Nguoi dung khong hop le"
        })
    
    otp = f"{random.randint(100000, 999999)}"
    redis_key = f"{PASSWORD_RESET_PREFIX}{data.email}"
    ttl_seconds = settings.password_reset_otp_expire_minutes * 60
    
    await redis_client.setex(redis_key, ttl_seconds, otp)

    try:
        send_otp_email_task.delay(user.email, otp)
    except Exception:
        # Không để lỗi gửi mail làm hỏng API quên mật khẩu
        pass
    
    return {"message": "Xác thực "}

async def verify_otp(db, data, redis_client):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(400, {
            "code": "USER_UNKNOWN",
            "message": "Nguoi dung khong hop le"
        })
    
    #lay otp tu redis
    otp_key = f"{PASSWORD_RESET_PREFIX}{data.email}"
    saved_otp = await redis_client.get(otp_key)

    if isinstance(saved_otp, bytes):
        saved_otp = saved_otp.decode("utf-8")

    #kiem tra otp het han
    if not saved_otp:
        raise HTTPException(400, {
            "code": "OTP_EXPIRED",
            "message": "OTP het han"
        })
    
    #ss otp
    if saved_otp != data.otp:
        raise HTTPException(400, {
            "code": "INVALID_OTP",
            "message": "OTP khong hop le"
        })
    
    #tao reset token
    reset_token = secrets.token_urlsafe(32)
    reset_key = f"password_reset_verified:{reset_token}"

    #luu vao redis
    await redis_client.setex(
        reset_key, 
        10 * 60, #10p
        str(user.user_id)
    )

    #neu dung thi xoa ma otp
    await redis_client.delete(otp_key)

    return {
        "message": "OTP hop le",
        "reset_token": reset_token
    }

async def reset_password(db, data, redis_client):
    #lay user_id
    reset_key = f"password_reset_verified:{data.reset_token}"
    user_id = await redis_client.get(reset_key)

    if isinstance(user_id, bytes):
        user_id = user_id.decode("utf-8")

    if not user_id:
        raise HTTPException(400, {
            "code": "USER_UNKNOWN",
            "message": "Nguoi dung khong hop le"
        })

    user = db.query(User).filter(User.user_id == int(user_id)).first()
    if not user:
        raise HTTPException(404, {
            "code": "USER_NOT_FOUND",
            "message": "User not found"
        })
    
    #doi mat khau
    user.password = hash_password(data.new_password)
    db.commit()

    await redis_client.delete(reset_key)

    return{
        "message": "Doi mat khau thanh cong"
    }
