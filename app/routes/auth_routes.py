from select import select

from fastapi import APIRouter, HTTPException
from app.schemas.auth_schema import RegisterUser
from app.schemas.auth_schema import LoginUser
from app.base.db import SessionLocal
from app.services.auth_service import register_service, login_service

router = APIRouter(prefix="/auth", tags=["Auth"])
db = SessionLocal()
@router.post("/register")
def register_user(data: RegisterUser):
    return register_service(db, data)

@router.post("/login")
def login_user(data: LoginUser):
    return login_service(db, data)
