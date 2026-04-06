from fastapi import APIRouter, Depends, Path, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Annotated
from starlette import status
from models import Todo
from database import Sessionlocal
from .auth import get_current_user

router = APIRouter(
    prefix = "/todo",
    tags = ["todo"]
)

def get_db():
    db = Sessionlocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]


class TodoRequest(BaseModel):
    title : str = Field(min_length=5)
    description : str = Field(min_length=10, max_length= 100)
    priority : int = Field(gt = 0, lt = 6)
    completed : bool


@router.get("/")
async def get_todo(db : db_dependency, user:user_dependency):
    return db.query(Todo).filter(Todo.owner_id==user.get("user_id")).all()

@router.get("/{todo_id}", status_code=status.HTTP_200_OK)
async def get_by_id(user: user_dependency,
                    db : db_dependency,
                    todo_id : int = Path(gt = 0)):
    todo1 = db.query(Todo).filter(Todo.id == todo_id) \
        .filter(Todo.owner_id==user.get("user_id")).first()
    if todo1 is not None:
        return todo1
    raise HTTPException(detail="Todo not found", status_code=404)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_todo(todoreq: TodoRequest, db : db_dependency,
                      user: user_dependency):
    todo_obj = Todo(**todoreq.model_dump())
    todo_obj.owner_id = user.get("user_id")
    db.add(todo_obj)
    db.commit()

@router.put("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_todo( db: db_dependency,
                       user: user_dependency,
                       todoreq: TodoRequest,
                       todo_id : int = Path(gt = 0)
                     ):
    todo1 = (db.query(Todo).filter(Todo.id==todo_id).
             filter(Todo.owner_id==user.get("user_id")).first())
    if todo1 is not None:

        todo1.title = todoreq.title
        todo1.description = todoreq.description
        todo1.priority = todoreq.priority
        todo1.completed = todoreq.completed

        db.add(todo1)
        db.commit()

    else :
        raise HTTPException(detail="No id found", status_code=404)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(db: db_dependency ,
                      user: user_dependency,
                      todo_id : int = Path(gt = 0)):
    todo1 = (db.query(Todo).filter(Todo.id==todo_id)
             .filter(Todo.owner_id==user.get("user_id")).first())
    if todo1 is None:
        raise HTTPException(detail = "No id found, can't delete", status_code=404)
    db.delete(todo1)
    db.commit()


