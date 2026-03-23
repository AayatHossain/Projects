from fastapi import FastAPI, Depends, Path, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import Column
from sqlalchemy.orm import Session
from typing import Annotated

from starlette import status

import models
from models import Todo
from database import engine, Sessionlocal

app = FastAPI()
models.Base.metadata.create_all(bind = engine)

def get_db():
    db = Sessionlocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


class TodoRequest(BaseModel):
    title : str = Field(min_length=5)
    description : str = Field(min_length=10, max_length= 100)
    priority : int = Field(gt = 0, lt = 6)
    completed : bool


@app.get("/todo")
async def get_todo(db : db_dependency):
    todo1 = db.query(Todo).all()
    return todo1

@app.get("/todo/{todo_id}", status_code=status.HTTP_200_OK)
async def get_by_id(db : db_dependency, todo_id : int = Path(gt = 0)):
    todo1 = db.query(Todo).filter(Todo.id == todo_id).first()
    if todo1 is not None:
        return todo1
    raise HTTPException(detail="Id not found", status_code=404)

@app.post("/todo", status_code=status.HTTP_201_CREATED)
async def create_todo(todoreq: TodoRequest, db : db_dependency):
    todo_obj = Todo(**todoreq.model_dump())
    db.add(todo_obj)
    db.commit()

@app.put("/todo/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_todo( db: db_dependency,
                       todoreq: TodoRequest,
                       todo_id : int = Path(gt = 0)
                     ):
    todo1 = db.query(Todo).filter(Todo.id==todo_id).first()
    if todo1 is not None:
        todo1.id = todo_id
        todo1.title = todoreq.title
        todo1.description = todoreq.description
        todo1.priority = todoreq.priority
        todo1.completed = todoreq.completed

        db.add(todo1)
        db.commit()

    else :
        raise HTTPException(detail="No id found", status_code=404)
