from pydantic import BaseModel, Field, EmailStr

class RegisterUser(BaseModel):
    name: str
    username: str
    password: str = Field(min_length= 6)
    mail: EmailStr
    grade: int

class LoginUser(BaseModel):
    username: str
    password: str = Field(min_length= 6)