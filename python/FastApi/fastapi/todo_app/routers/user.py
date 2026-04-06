from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Annotated
from starlette import status
from models import User
from database import Sessionlocal
from .auth import get_current_user, bcrypt_context

router = APIRouter(
    prefix="/user",
    tags = ["user"]
)

def get_db():
    db = Sessionlocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

@router.get("/",status_code=status.HTTP_200_OK)
async def get_user(user: user_dependency, db: db_dependency):
    user1 = db.query(User).filter(User.id==user.get("user_id")).first()
    if user1 is None:
        raise HTTPException(status_code=401, detail="No user")
    return user1

@router.put("/", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(user: user_dependency, db: db_dependency, new_password: str):
    user1 = db.query(User).filter(User.id == user.get("user_id")).first()
    if user1 is None:
        raise HTTPException(status_code=401, detail="No user")
    user1.hashed_password = bcrypt_context.hash(new_password)
    db.add(user1)
    db.commit()

