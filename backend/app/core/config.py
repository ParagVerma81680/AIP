from pydantic_settings import BaseSettings
from typing import List, Optional
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_DEFAULT_DB_PATH = (_BACKEND_DIR / "swiftmart.db").as_posix()

class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite+aiosqlite:///{_DEFAULT_DB_PATH}"
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173", 
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "https://paragverma81680.github.io"
    ]

    # AI Configuration (Provider Agnostic)
    AI_PROVIDER: str = "groq"
    AI_API_KEY: str = ""
    AI_MODEL: str = "openai/gpt-oss-120b"
    AI_BASE_URL: str = "https://api.groq.com/openai/v1"
    AIP_SYSTEM_IDENTITY: str = (
        "You are AIP, an intelligent, helpful, conversational AI assistant for SwiftMart. "
        "You can assist with grocery shopping, recipe meal planning, budget optimization, "
        "supermarket route navigation, document analysis, and general knowledge. "
        "Be honest about uncertainty, maintain conversational context, and never fabricate facts."
    )

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
