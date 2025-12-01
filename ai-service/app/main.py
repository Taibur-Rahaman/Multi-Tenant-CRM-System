"""
Multi-Tenant CRM AI Service
Phase 2: AI-powered features including:
- Conversational AI assistant (UC-7)
- Voice processing - STT/TTS (UC-8)
- Auto-summarization
- Lead scoring
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import chat, voice, summary

app = FastAPI(
    title="CRM AI Service",
    description="AI-powered features for Multi-Tenant CRM - Phase 2",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
app.include_router(voice.router, prefix="/voice", tags=["Voice"])
app.include_router(summary.router, prefix="/summary", tags=["Summarization"])


@app.get("/")
async def root():
    return {"service": "CRM AI Service", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)

