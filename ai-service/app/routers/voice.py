"""Voice Router - Speech-to-Text and Text-to-Speech"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import logging
import io

from app.middleware.auth import get_current_user
from app.services.voice_service import VoiceService

router = APIRouter()
logger = logging.getLogger(__name__)

voice_service = VoiceService()


class TranscriptionResponse(BaseModel):
    success: bool
    text: str
    language: Optional[str] = None
    confidence: Optional[float] = None


class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    voice: Optional[str] = None


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Transcribe audio file to text using Whisper.
    Supports: mp3, wav, m4a, webm, mp4, mpga, mpeg, oga, ogg, flac
    """
    try:
        # Validate file type
        allowed_types = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/webm", 
                        "audio/ogg", "audio/flac", "audio/m4a"]
        
        if file.content_type and file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported audio format: {file.content_type}"
            )
        
        # Read file content
        audio_content = await file.read()
        
        # Transcribe
        result = await voice_service.transcribe(audio_content, language)
        
        return TranscriptionResponse(
            success=True,
            text=result["text"],
            language=result.get("language"),
            confidence=result.get("confidence")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed")


@router.post("/synthesize")
async def synthesize_speech(
    request: TTSRequest,
    current_user: dict = Depends(get_current_user)
):
    """Convert text to speech audio"""
    try:
        if len(request.text) > 5000:
            raise HTTPException(status_code=400, detail="Text too long (max 5000 chars)")
        
        audio_content = await voice_service.synthesize(
            request.text,
            language=request.language,
            voice=request.voice
        )
        
        return StreamingResponse(
            io.BytesIO(audio_content),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail="Speech synthesis failed")


@router.post("/voice-command")
async def process_voice_command(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Process voice command and return appropriate action.
    Supports commands like:
    - "Show customer details for [name]"
    - "Summarize this email"
    - "Create a task for [customer]"
    - "What are my pending tasks?"
    """
    try:
        # Transcribe the audio
        audio_content = await file.read()
        transcription = await voice_service.transcribe(audio_content)
        command_text = transcription["text"]
        
        # Parse command intent
        from app.services.llm_service import LLMService
        llm = LLMService()
        
        intent_prompt = f"""Analyze this voice command and extract the intent and entities:
Command: "{command_text}"

Respond in JSON format:
{{
  "intent": "one of: show_customer, summarize, create_task, list_tasks, search, unknown",
  "entities": {{
    "customer_name": "if mentioned",
    "task_description": "if creating task",
    "search_query": "if searching"
  }},
  "confidence": 0.0-1.0
}}"""

        intent_result = await llm.generate_json(intent_prompt)
        
        return {
            "success": True,
            "data": {
                "transcription": command_text,
                "intent": intent_result.get("intent", "unknown"),
                "entities": intent_result.get("entities", {}),
                "confidence": intent_result.get("confidence", 0)
            }
        }
    
    except Exception as e:
        logger.error(f"Voice command error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process voice command")

