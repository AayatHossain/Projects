from typing import Annotated

from fastapi.params import Query
from sqlalchemy.orm import Session
from starlette import status
from database import engine,SessionLocal
import models
from models import Todos
from fastapi import FastAPI, Depends, HTTPException, Path

app = FastAPI()
# models.Base.metadata.create_all(bind = engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@app.get("/", status_code = status.HTTP_200_OK)
async def all_entries(db: db_dependency):
    entries = db.query(Todos).all()
    if entries is not None:
        return entries
    else:
        raise HTTPException(status_code=404, detail = "No entries")

@app.get("/todos/{id}", status_code=status.HTTP_200_OK)
async def get_by_id( db: db_dependency, id: int = Path(gt=0)):
    entries = db.query(Todos).filter(Todos.id==id).first()

    if entries is not None:
        return entries
    else:
        raise HTTPException(status_code=404, detail = "No entries with this id")