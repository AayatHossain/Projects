from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    firebase_credentials: str = "serviceAccountKey.json"
    firebase_db_url: str = "https://quickaid-70d9b-default-rtdb.firebaseio.com"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    cors_origins: str = "*"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"


settings = Settings()
