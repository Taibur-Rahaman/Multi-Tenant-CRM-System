"""Configuration settings for AI Service"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8001
    DEBUG: bool = False
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # JWT Settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-256-bit-secret")
    JWT_ALGORITHM: str = "HS256"
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://postgres:postgres@localhost:5432/crm_db"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # CRM Backend
    CRM_BACKEND_URL: str = os.getenv("CRM_BACKEND_URL", "http://localhost:8080/api")
    
    # Voice Settings
    WHISPER_MODEL: str = "base"
    TTS_PROVIDER: str = "gtts"  # gtts, azure, google
    
    # Azure TTS (optional)
    AZURE_SPEECH_KEY: str = os.getenv("AZURE_SPEECH_KEY", "")
    AZURE_SPEECH_REGION: str = os.getenv("AZURE_SPEECH_REGION", "eastus")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

