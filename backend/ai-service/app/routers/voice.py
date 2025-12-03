"""
Voice Router - UC-8: Voice Interaction
Speech-to-Text (STT) and Text-to-Speech (TTS) functionality
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app.services.voice_service import VoiceService
import io

router = APIRouter()
voice_service = VoiceService()


class TTSRequest(BaseModel):
    text: str
    language: str = "en"


class STTResponse(BaseModel):
    text: str
    confidence: Optional[float] = None
    language: Optional[str] = None


@router.post("/speech-to-text", response_model=STTResponse)
async def speech_to_text(audio: UploadFile = File(...)):
    """
    UC-8: Convert speech to text
    Accepts audio file and returns transcribed text
    """
    try:
        audio_content = await audio.read()
        result = await voice_service.transcribe(audio_content, audio.filename)
        return STTResponse(
            text=result["text"],
            confidence=result.get("confidence"),
            language=result.get("language", "en")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text-to-speech")
async def text_to_speech(request: TTSRequest):
    """
    UC-8: Convert text to speech
    Returns audio stream
    """
    try:
        audio_bytes = await voice_service.synthesize(request.text, request.language)
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mp3",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice-command")
async def voice_command(audio: UploadFile = File(...)):
    """
    UC-8: Process voice command
    Transcribe audio, understand intent, execute command
    """
    try:
        audio_content = await audio.read()
        
        # Step 1: Transcribe
        transcription = await voice_service.transcribe(audio_content, audio.filename)
        
        # Step 2: Process command
        result = await voice_service.process_command(transcription["text"])
        
        return {
            "transcription": transcription["text"],
            "intent": result.get("intent"),
            "action": result.get("action"),
            "response": result.get("response")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

