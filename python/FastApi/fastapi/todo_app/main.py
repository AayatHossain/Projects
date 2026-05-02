from fastapi import FastAPI
from .models import Base
from .database import engine
from .routers import todo,auth,admin,user
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title = "Todo_App")

Base.metadata.create_all(bind = engine)

app.include_router(todo.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(user.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

