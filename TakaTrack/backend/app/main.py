"""TakaTrack backend.

FastAPI service backed by Firebase Realtime Database. Phase 1 ships
authentication (register / login / me); budgets, expenses, goals, and the
literacy arcade come next.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .firebase import init_firebase
from .routers import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail fast at startup if Firebase can't be initialised.
    init_firebase()
    yield


app = FastAPI(title="TakaTrack API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "takatrack-backend"}
