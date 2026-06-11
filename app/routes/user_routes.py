from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.schemas.auth_schema import RegisterUser
from app.dependencies.auth_dependency import require_roles
from app.schemas.user_schema import UserQueryParams
from app.services import user_service
from app.services.auth_service import hash_password
from app.dependencies.db_dependency import get_db

router = APIRouter(prefix="/users", tags=["Users"], dependencies=[Depends(require_roles("admin"))])

@router.get("/")
def get_users(params: UserQueryParams = Depends(), db: Session = Depends(get_db)):
    return user_service.get_users(params, db)

@router.get("/{user_uuid}")
def get_user(user_uuid: UUID, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.uuid == user_uuid).first()
    if not u:
        raise HTTPException(404, {"code": "USER_NOT_FOUND", "message": "User not found"})
    return u

@router.put("/{user_uuid}")
def update_user(user_uuid: UUID, user: RegisterUser, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.uuid == user_uuid).first()
    if not u:
        raise HTTPException(404, {"code": "USER_NOT_FOUND", "message": "User not found"})
    u.name = user.name
    u.username = user.username
    u.password = hash_password(user.password)
    u.email = user.email
    u.grade = user.grade
    db.commit()
    return {"message": "User updated successfully"}

@router.delete("/{user_uuid}")
def delete_user(user_uuid: UUID, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.uuid == user_uuid).first()
    if not u:
        raise HTTPException(404, {"code": "USER_NOT_FOUND", "message": "User not found"})
    db.delete(u)
    db.commit()
    return {"message": "User deleted successfully"}
