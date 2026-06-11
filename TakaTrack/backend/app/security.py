"""Password hashing (bcrypt) and JWT token helpers."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from .config import settings

# bcrypt only hashes the first 72 bytes of a password; longer inputs raise.
_BCRYPT_MAX_BYTES = 72


def _clip(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_clip(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(_clip(password), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_token(uid: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": uid,
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Raises jwt.PyJWTError on invalid/expired tokens."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
