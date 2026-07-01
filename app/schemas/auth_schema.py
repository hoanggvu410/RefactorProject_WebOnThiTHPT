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

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)

class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str = Field(min_length=6)

class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    message: str
    access_token: str
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ResetTokenResponse(BaseModel):
    message: str
    reset_token: str