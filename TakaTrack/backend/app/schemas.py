"""Request/response models for the TakaTrack API."""
from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    uid: str
    name: str
    email: EmailStr


class AuthOut(BaseModel):
    token: str
    user: UserOut
