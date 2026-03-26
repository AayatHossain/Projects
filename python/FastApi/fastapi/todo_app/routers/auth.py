from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Sessionlocal
from models import User

router = APIRouter()

class UserRequest(BaseModel):

    username : str
    email : str
    role : str
    password : str

def get_db():
    db = Sessionlocal()
    try:
        yield  db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/auth")
async def create_user(db : db_dependency, user: UserRequest):
    new_user = User(

        username = user.username,
        email=user.email,
        hashed_password = user.password,
        role = user.role,
        is_active = True
    )
    if new_user.username is None:
        raise HTTPException(status_code=401, detail = "Invalid username")
    db.add(new_user)
    db.commit()

@router.get("/auth")
async def get_users(db : db_dependency):
    return db.query(User).all()
