from fastapi import APIRouter, Depends, Path, HTTPException
from sqlalchemy.orm import Session
from typing import Annotated
from starlette import status
from ..models import Todo
from ..database import Sessionlocal
from .auth import get_current_user

router = APIRouter(
    prefix="/admin",
    tags = ["admin"]
)

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
