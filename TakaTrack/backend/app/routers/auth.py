"""Authentication: register, login, and current-user lookup.

Users are stored in the Realtime Database:

    /users/{uid}              -> { name, email, password_hash, created_at }
    /emailIndex/{emailKey}    -> uid        (lookup table for login)

``emailKey`` is the lowercased email with '.' replaced by ',', because '.' is
not allowed in Realtime Database keys. This avoids needing a query index.
"""
import uuid
from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..firebase import ref
from ..schemas import AuthOut, LoginIn, RegisterIn, UserOut
from ..security import create_token, decode_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer(auto_error=True)


def _email_key(email: str) -> str:
    return email.strip().lower().replace(".", ",")


@router.post("/register", response_model=AuthOut, status_code=status.HTTP_201_CREATED)
def register(body: RegisterIn):
    email = body.email.lower()
    ekey = _email_key(email)

    if ref(f"emailIndex/{ekey}").get():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    uid = uuid.uuid4().hex
    ref(f"users/{uid}").set(
        {
            "name": body.name.strip(),
            "email": email,
            "password_hash": hash_password(body.password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    ref(f"emailIndex/{ekey}").set(uid)

    user = UserOut(uid=uid, name=body.name.strip(), email=email)
    return AuthOut(token=create_token(uid, email), user=user)


@router.post("/login", response_model=AuthOut)
def login(body: LoginIn):
    email = body.email.lower()
    uid = ref(f"emailIndex/{_email_key(email)}").get()
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    data = ref(f"users/{uid}").get()
    if not data or not verify_password(body.password, data.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = UserOut(uid=uid, name=data["name"], email=data["email"])
    return AuthOut(token=create_token(uid, user.email), user=user)


def current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> UserOut:
    try:
        payload = decode_token(creds.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    uid = payload.get("sub")
    data = ref(f"users/{uid}").get() if uid else None
    if not data:
        raise HTTPException(status_code=401, detail="User no longer exists.")
    return UserOut(uid=uid, name=data["name"], email=data["email"])


@router.get("/me", response_model=UserOut)
def me(user: UserOut = Depends(current_user)):
    return user
