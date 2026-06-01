import os
from dotenv import load_dotenv
from jose import jwt
from datetime import timedelta, datetime
from fastapi import HTTPException
from passlib.context import CryptContext
from app.models.user_model import User
from app.models.refresh_token_model import RefreshToken

#JWT
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY")

#Tao token
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

#hash password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):

    return pwd_context.hash(password)

def  verify_password(plain_password, hashed_password):

    return pwd_context.verify(plain_password, hashed_password)

#register
def register_service(db, data):
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
        mail = data.mail,
        grade = data.grade
    )
    db.add(new_user)
    db.commit()
    return {"message": "user created successfully"}

#login
def login_service(db, data):
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
        "role": user.role
    })
    refresh_token = create_refresh_token(data={
        "sub": user.username,
        "role": user.role
    })

#luu refresh token vao db
    db_token = RefreshToken(
        user_id=user.userID,
        token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.add(db_token)
    db.commit()

    return {
        "message": "Login successfully",
        "access_token": access_token,
        "refresh_token": refresh_token
    }

