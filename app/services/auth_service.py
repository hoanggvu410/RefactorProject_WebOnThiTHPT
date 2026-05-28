from jose import jwt
from datetime import timedelta, datetime
from fastapi import HTTPException
from passlib.context import CryptContext
from app.models.user_model import User

#JWT
SECRET_KEY = "123456"
ALGORITHM = "HS256"
REFRESH_SECRET_KEY = "654321"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=45)
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


def login_service(db, data):
    user = db.query(User).filter(User.username == data.username).first()

    if not user:
        raise HTTPException(404, {
            'code': "USER_NOT_FOUND",
            'message': "User not found"
        })
    if not verify_password(data.password, user.password):
        raise HTTPException(404, {
            'code': "INCORRECT_PASSWORD",
            'message': "Incorrect password"
        })

    token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    return {
        "message": "Login successfully",
        "access_token": token,
        "refresh_token": refresh_token
    }

