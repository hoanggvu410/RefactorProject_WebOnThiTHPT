from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.auth_schema import RegisterUser, LoginUser, ChangePassword
from app.dependencies.db_dependency import get_db
from app.services import auth_service
from app.schemas.auth_schema import RefreshTokenRequest
from app.dependencies.auth_dependency import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register_user(data: RegisterUser, db: Session = Depends(get_db)):
    return auth_service.register(db, data)

@router.post("/login")
def login(data: LoginUser, db: Session = Depends(get_db)):
    return auth_service.login(db, data)

@router.post("/refresh")
def refresh(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_token(db, data)

@router.post("/logout")
def logout(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    return auth_service.logout(db, data)

@router.post("/change-password")
def change_password(data: ChangePassword, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return auth_service.change_password(db, current_user, data)
