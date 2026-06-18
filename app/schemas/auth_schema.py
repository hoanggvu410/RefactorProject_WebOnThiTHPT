from pydantic import BaseModel, Field, EmailStr

class RegisterUser(BaseModel):
    name: str
    username: str
    password: str = Field(min_length= 6)
    email: EmailStr
    grade: int

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

class LoginUser(BaseModel):
    username: str
    password: str = Field(min_length= 6)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class verifyEmailRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6)