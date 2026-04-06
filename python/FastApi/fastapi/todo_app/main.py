from fastapi import FastAPI
import models
from database import engine
from routers import todo,auth,admin,user

app = FastAPI(title = "Todo_App")

models.Base.metadata.create_all(bind = engine)

app.include_router(todo.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(user.router)

