"""
MCP Server Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """MCP Server settings"""
    
    # CRM Backend API
    CRM_API_URL: str = "http://localhost:8080/api"
    CRM_API_TIMEOUT: int = 30
    
    # Authentication
    API_TOKEN: Optional[str] = None
    TENANT_ID: Optional[str] = None
    
    # Server
    SERVER_NAME: str = "crm-mcp-server"
    SERVER_VERSION: str = "1.0.0"
    
    class Config:
        env_file = ".env"
        env_prefix = "MCP_"


settings = Settings()

