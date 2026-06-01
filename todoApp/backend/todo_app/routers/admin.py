from fastapi import APIRouter, Depends, Path, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Annotated, List, Optional
from starlette import status
from ..models import Todo, User
from ..database import Sessionlocal
from .auth import get_current_user

router = APIRouter(
    prefix="/admin",
    tags = ["admin"]
)


class UserResponse(BaseModel):
    id: int
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None

    class Config:
        from_attributes = True

def get_db():
    db = Sessionlocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

@router.get("/", status_code=status.HTTP_200_OK)
async def get_todo(user: user_dependency, db: db_dependency):
    if user is None or user.get("user_role") != "admin":
        raise HTTPException(status_code=401, detail = "Not an admin")
    return db.query(Todo).all()

@router.get("/users", status_code=status.HTTP_200_OK, response_model=List[UserResponse])
async def get_users(user: user_dependency, db: db_dependency):
    if user is None or user.get("user_role") != "admin":
        raise HTTPException(status_code=401, detail = "Not an admin")
    return db.query(User).all()

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(db: db_dependency ,
                      user: user_dependency,
                      todo_id : int = Path(gt = 0)):

    if user is None or user.get("user_role") != "admin":
        raise HTTPException(status_code=401, detail = "Not an admin")

    todo1 = (db.query(Todo).filter(Todo.id==todo_id).first())

    if todo1 is None:
        raise HTTPException(detail = "No id found, can't delete", status_code=status.HTTP_404_NOT_FOUND)

    db.delete(todo1)
    db.commit()

@router.delete("/user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(db: db_dependency,
                      user: user_dependency,
                      user_id: int = Path(gt=0)):

    if user is None or user.get("user_role") != "admin":
        raise HTTPException(status_code=401, detail="Not an admin")

    if user.get("user_id") == user_id:
        raise HTTPException(status_code=400, detail="Admin can't delete their own account")

    user1 = db.query(User).filter(User.id == user_id).first()

    if user1 is None:
        raise HTTPException(detail="No user found, can't delete", status_code=status.HTTP_404_NOT_FOUND)

    db.query(Todo).filter(Todo.owner_id == user_id).delete()
    db.delete(user1)
    db.commit()
