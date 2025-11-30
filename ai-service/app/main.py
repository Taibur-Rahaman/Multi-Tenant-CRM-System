"""
Multi-Tenant CRM AI Service
FastAPI microservice for AI-powered features including:
- Conversational AI assistant
- Summarization & insights
- Voice processing (STT/TTS)
- Automation engine
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.routers import chat, summarization, voice, insights, automation
from app.middleware.auth import JWTAuthMiddleware
from app.middleware.tenant import TenantMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting AI Service...")
    # Startup: Initialize connections, load models
    yield
    # Shutdown: Cleanup
    logger.info("Shutting down AI Service...")


app = FastAPI(
    title="CRM AI Service",
    description="AI-powered features for Multi-Tenant CRM",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(JWTAuthMiddleware)
app.add_middleware(TenantMiddleware)

# Include routers
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(summarization.router, prefix="/summarize", tags=["Summarization"])
app.include_router(voice.router, prefix="/voice", tags=["Voice"])
app.include_router(insights.router, prefix="/insights", tags=["Insights"])
app.include_router(automation.router, prefix="/automation", tags=["Automation"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "CRM AI Service", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-service"}


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "An internal error occurred"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)

