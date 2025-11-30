"""Voice Service - Speech-to-Text and Text-to-Speech"""

from openai import AsyncOpenAI
from gtts import gTTS
from app.config import settings
import io
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class VoiceService:
    """Service for voice processing (STT/TTS)"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.tts_provider = settings.TTS_PROVIDER
    
    async def transcribe(
        self, 
        audio_content: bytes, 
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transcribe audio to text using Whisper.
        
        Args:
            audio_content: Audio file bytes
            language: Optional language code (e.g., 'en', 'es')
        
        Returns:
            Dict with transcription result
        """
        try:
            # Create a file-like object from bytes
            audio_file = io.BytesIO(audio_content)
            audio_file.name = "audio.mp3"  # Whisper needs a filename
            
            # Use OpenAI's Whisper API
            response = await self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language
            )
            
            return {
                "text": response.text,
                "language": language or "auto-detected",
                "confidence": None  # Whisper doesn't return confidence
            }
        
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            raise
    
    async def synthesize(
        self, 
        text: str, 
        language: str = "en",
        voice: Optional[str] = None
    ) -> bytes:
        """
        Convert text to speech.
        
        Args:
            text: Text to convert
            language: Language code
            voice: Voice name (provider-specific)
        
        Returns:
            Audio file bytes (MP3)
        """
        try:
            if self.tts_provider == "openai":
                return await self._synthesize_openai(text, voice or "alloy")
            elif self.tts_provider == "azure":
                return await self._synthesize_azure(text, language, voice)
            else:
                return await self._synthesize_gtts(text, language)
        
        except Exception as e:
            logger.error(f"TTS error: {e}")
            raise
    
    async def _synthesize_openai(self, text: str, voice: str = "alloy") -> bytes:
        """Use OpenAI TTS"""
        response = await self.client.audio.speech.create(
            model="tts-1",
            voice=voice,  # alloy, echo, fable, onyx, nova, shimmer
            input=text
        )
        
        # Read all content from the response
        audio_content = b""
        async for chunk in response.iter_bytes():
            audio_content += chunk
        return audio_content
    
    async def _synthesize_gtts(self, text: str, language: str) -> bytes:
        """Use Google Text-to-Speech (free)"""
        tts = gTTS(text=text, lang=language, slow=False)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        return audio_buffer.read()
    
    async def _synthesize_azure(
        self, 
        text: str, 
        language: str, 
        voice: Optional[str]
    ) -> bytes:
        """Use Azure Cognitive Services TTS"""
        # Azure implementation would go here
        # Requires azure-cognitiveservices-speech package
        raise NotImplementedError("Azure TTS not configured")

