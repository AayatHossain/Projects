import os

import firebase_admin
from firebase_admin import credentials, db

from .config import settings

_initialized = False


def _resolve_credentials_path() -> str:
    path = settings.firebase_credentials
    if not os.path.isabs(path):
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(backend_dir, path)
    return path


def init_firebase() -> None:
    global _initialized
    if _initialized or firebase_admin._apps:
        _initialized = True
        return

    cred_path = _resolve_credentials_path()
    if not os.path.exists(cred_path):
        raise RuntimeError(
            f"Firebase service-account key not found at {cred_path}. "
            "Copy your service-account JSON there, or set FIREBASE_CREDENTIALS "
            "in backend/.env — see .env.example."
        )

    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {"databaseURL": settings.firebase_db_url})
    _initialized = True


def ref(path: str):
    init_firebase()
    return db.reference(path)
