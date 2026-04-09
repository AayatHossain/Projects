from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import Sessionlocal
from models import User
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

router = APIRouter(
    prefix = "/auth",
    tags = ["auth"]
)
bcrypt_context =  CryptContext(schemes=['bcrypt'], deprecated = 'auto')

class UserRequest(BaseModel):

    username : str
    email : str
    role : str
    password : str
    phone_number: str


def get_db():
    db = Sessionlocal()
    try:
        yield  db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/")
async def create_user(db : db_dependency, user: UserRequest):
    new_user = User(

        username = user.username,
        email=user.email,
        hashed_password = bcrypt_context.hash(user.password),
        role = user.role,
        is_active = True,
        phone_number =user.phone_number


    )
    if new_user.username is None:
        raise HTTPException(status_code=401, detail = "Invalid username")

    db.add(new_user)
    db.commit()


def authentication(username: str, password: str, db: db_dependency):
    user = db.query(User).filter(User.username==username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="invalid credentials")
    if not bcrypt_context.verify(password,user.hashed_password):
        raise HTTPException(status_code=401, detail="invalid credentials")
    return user


SECRET_KEY = '9f3c1a7e8b2d4c6f9a0b1e2d3c4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2'
ALGORITHM = 'HS256'

def create_token(user_role: int, user_id: int, username:str,expiry_time: timedelta):
    encode_val = {'role': user_role, 'sub':username, 'id':user_id, 'exp' : datetime.now(timezone.utc)  + expiry_time}
    token = jwt.encode(encode_val, SECRET_KEY, algorithm = ALGORITHM)
    return token


class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/token", response_model=Token)
async def login_for_token(form: Annotated[OAuth2PasswordRequestForm, Depends()],
                          db: db_dependency):
    user = authentication(form.username,form.password,db)
    if user is None:
        raise HTTPException(status_code=401, detail="invalid credentials")
    token = create_token(user.role, user.id, user.username, timedelta(minutes=20))
    return {
        "access_token" : token,
        "token_type" : "bearer"
    }

oauth2_bearer = OAuth2PasswordBearer("/auth/token")
async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username : str = payload.get('sub')
        user_id : int = payload.get('id')
        user_role: int = payload.get('role')
        if username is None or user_id is None:
            raise HTTPException(status_code=401, detail="invalid credentials")
        return {"username" : username, "user_id" : user_id, 'user_role':user_role}
    except JWTError:
        raise HTTPException(status_code=401, detail="invalid credentials")
