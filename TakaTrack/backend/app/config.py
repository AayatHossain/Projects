"""TakaTrack backend configuration.

Values can be overridden via environment variables or a .env file
(see .env.example). Secrets (JWT secret, service-account path) live in .env,
which is gitignored — never commit them.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Firebase Realtime Database ---
    # Path to the Firebase service-account JSON (relative to the backend/ folder
    # or absolute). The Admin SDK uses this to talk to the Realtime Database.
    firebase_credentials: str = "serviceAccountKey.json"
    # Realtime Database URL for the quickaid-70d9b project.
    firebase_db_url: str = "https://quickaid-70d9b-default-rtdb.firebaseio.com"

    # --- Auth / JWT ---
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Comma-separated CORS origins (use * for local dev).
    cors_origins: str = "*"


settings = Settings()
