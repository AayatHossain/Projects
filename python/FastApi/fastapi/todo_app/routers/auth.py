from fastapi import APIRouter

router = APIRouter()

@router.get("/auth")
async def auth_func():
    return {"User Authenticated"}