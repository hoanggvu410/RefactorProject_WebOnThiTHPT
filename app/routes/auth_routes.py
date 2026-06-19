from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.orm import Session
from app.core.redis import get_redis
from app.schemas.auth_schema import ForgotPasswordRequest, RegisterUser, LoginUser, ChangePassword, ResetPasswordRequest, VerifyOtpRequest, verifyEmailRequest
from app.dependencies.db_dependency import get_db
from app.services import auth_service
from app.schemas.auth_schema import RefreshTokenRequest
from app.dependencies.auth_dependency import get_current_user, security

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
async def register_user(data: RegisterUser, db: Session = Depends(get_db)):
    return await auth_service.register(db, data)

@router.post("/login")
def login(data: LoginUser, db: Session = Depends(get_db)):
    return auth_service.login(db, data)

@router.post("/refresh")
def refresh(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_access_token(db, data)

@router.post("/logout")
async def logout(
    data: RefreshTokenRequest, 
    credentials = Depends(security),
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.logout(data, credentials, redis_client, db)

@router.post("/change-password")
def change_password(data: ChangePassword, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return auth_service.change_password(db, current_user, data)

@router.post("/send-verify-email")
async def send_verify_email(
    current_user = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    return await auth_service.send_verify_email(current_user, redis_client)

@router.post("/verify-email")
async def verify_email(
    data: verifyEmailRequest,
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.verify_email(db, data, redis_client)

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.forgot_password(db, data, redis_client)

@router.post("/verify_otp")
async def verify_otp(
    data: VerifyOtpRequest,
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.verify_otp(db, data, redis_client)

@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.reset_password(db, data, redis_client)