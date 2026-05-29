from fastapi import APIRouter, HTTPException
from fastapi.params import Depends
from app.models.user_model import User
from app.schemas.auth_schema import RegisterUser
from app.base.db import SessionLocal
from app.dependencies.auth_dependency import get_current_user
from app.dependencies.auth_dependency import require_roles

router = APIRouter(prefix = "/users", tags = ["Users"], dependencies = [Depends(require_roles("admin"))])
db = SessionLocal()
@router.get("/")
def get_users():
    return db.query(User).all()

@router.get("/profile")
def get_user_profile(user = Depends(get_current_user)):
    return {
        "username": user.get("sub"),
        "role": user.get("role")
            }

@router.get("/{user_id}")
def get_user(user_id: int):
    u = db.query(User).filter(User.userID == user_id).first()
    if not u:
        raise HTTPException(404, {
            "code": "USER_NOT_FOUND",
            "message": "User not found"
        })
    return u

@router.put("/{user_id}")
def update_user(user_id: int, user: RegisterUser):
    u = db.query(User).filter(User.userID == user_id).first()
    if not u:
        raise HTTPException(404, {
            "code": "USER_NOT_FOUND",
            "message": "User not found"
        })

    u.name = user.name
    u.username = user.username
    u.password = user.password
    u.mail = user.mail
    u.grade = user.grade
    db.commit()
    return {"message": "User updated successfully"}

@router.delete("/{user_id}")
def delete_user(user_id: int):
    u = db.query(User).filter(User.userID == user_id).first()
    if not u:
        raise HTTPException(404, {
            "code": "USER_NOT_FOUND",
            "message": "User not found"
        })
    db.delete(u)
    db.commit()
    return {"message": "User deleted successfully"}
