"""Firebase Realtime Database access via the Admin SDK.

The Admin SDK authenticates with the service-account key, so it has full
read/write access and bypasses database security rules — the React Native app
never touches Firebase directly, it only calls this FastAPI backend.

Only the Realtime Database is used (no Firebase Storage), which keeps the
project on the free Spark plan.
"""
import os

import firebase_admin
from firebase_admin import credentials, db

from .config import settings

_initialized = False


def _resolve_credentials_path() -> str:
    path = settings.firebase_credentials
    if not os.path.isabs(path):
        # Resolve relative to the backend/ folder (parent of app/).
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(backend_dir, path)
    return path


def init_firebase() -> None:
    """Initialise the Admin SDK once (idempotent)."""
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
    """Return a Realtime Database reference at ``path`` (e.g. 'users/<uid>')."""
    init_firebase()
    return db.reference(path)
