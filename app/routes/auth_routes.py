import re
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from redis.asyncio import Redis
from sqlalchemy.orm import Session
from app.core.oauth import oauth
from app.core.redis import get_redis
from app.schemas.auth_schema import (
    ForgotPasswordRequest,
    RegisterUser,
    LoginUser,
    ChangePassword,
    ResetPasswordRequest,
    VerifyOtpRequest,
    verifyEmailRequest,
    RefreshTokenRequest,
    MessageResponse,
    TokenResponse,
    AccessTokenResponse,
    ResetTokenResponse,
)
from app.dependencies.db_dependency import get_db
from app.services import auth_service
from app.schemas.auth_schema import RefreshTokenRequest
from app.dependencies.auth_dependency import get_current_user, security
from config import get_settings

settings =get_settings()
router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=MessageResponse)
def register_user(data: RegisterUser, db: Session = Depends(get_db)):
    return auth_service.register(db, data)

@router.post("/login", response_model=TokenResponse)
def login(data: LoginUser, db: Session = Depends(get_db)):
    return auth_service.login(db, data)

@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_access_token(db, data)

@router.post("/logout", response_model=MessageResponse)
async def logout(
    data: RefreshTokenRequest, 
    credentials = Depends(security),
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.logout(data, credentials, redis_client, db)

@router.post("/change-password", response_model=MessageResponse)
def change_password(data: ChangePassword, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return auth_service.change_password(db, current_user, data)

@router.post("/send-verify-email", response_model=MessageResponse)
async def send_verify_email(
    current_user = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.send_verify_email(db,current_user, redis_client)

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    data: verifyEmailRequest,
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.verify_email(db, data, redis_client)

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.forgot_password(db, data, redis_client)

@router.post("/verify-reset-otp", response_model=ResetTokenResponse)
async def verify_reset_otp(
    data: VerifyOtpRequest,
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.verify_reset_otp(db, data, redis_client)

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: ResetPasswordRequest,
    redis_client: Redis = Depends(get_redis),
    db: Session = Depends(get_db)
):
    return await auth_service.reset_password(db, data, redis_client)

@router.get("/google/login")
async def google_login(request: Request):
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri, prompt="select_account")

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")

        if not user_info:
            user_info = await oauth.google.userinfo(token = token)

        user = auth_service.get_or_create_oauth_user(db, user_info)
        tokens = auth_service.create_token(db, user)

        query = urlencode({
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
        })

        return RedirectResponse(
            url=f"{settings.frontend_url}/#/oauth/callback?{query}"
        )
    except Exception:
        query = urlencode({
            "error": "oauth_failed"
        })
        return RedirectResponse(
            url =f"{settings.frontend_url}/#/oauth/callback?{query}"
        )
