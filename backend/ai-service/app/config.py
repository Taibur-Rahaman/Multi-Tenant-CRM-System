"""
AI Service Configuration
"""
fr pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    
    # CRM Backend
    CRM_BACKEND_URL: str = "http://localhost:8080/api"
    
    # JWT
    JWT_SECRET: str = "your-256-bit-secret-key-for-jwt-token-signing"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"


settings = Settings()

