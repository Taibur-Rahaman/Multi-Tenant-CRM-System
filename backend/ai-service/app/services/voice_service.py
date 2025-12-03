"""
Voice Service - Speech-to-Text (STT) and Text-to-Speech (TTS)
UC-8: Voice Interaction
"""

from typing import Dict, Any, Optional
import io
import tempfile
import os


class VoiceService:
    """Voice processing for CRM - STT and TTS"""
    
    def __init__(self):
        self.supported_formats = [".wav", ".mp3", ".ogg", ".flac", ".m4a"]
    
    async def transcribe(self, audio_content: bytes, filename: str) -> Dict[str, Any]:
        """
        UC-8: Speech-to-Text
        Convert audio to text using speech recognition
        """
        try:
            import speech_recognition as sr
            
            # Get file extension
            ext = os.path.splitext(filename)[1].lower() if filename else ".wav"
            
            # Save to temp file
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(audio_content)
                tmp_path = tmp.name
            
            try:
                recognizer = sr.Recognizer()
                
                # Convert to AudioFile
                with sr.AudioFile(tmp_path) as source:
                    audio_data = recognizer.record(source)
                
                # Transcribe using Google Speech Recognition (free)
                text = recognizer.recognize_google(audio_data)
                
                return {
                    "text": text,
                    "confidence": 0.95,
                    "language": "en"
                }
            finally:
                os.unlink(tmp_path)
                
        except ImportError:
            # Demo mode if speech_recognition not installed
            return {
                "text": "This is a demo transcription. Install speech_recognition for real STT.",
                "confidence": 1.0,
                "language": "en"
            }
        except Exception as e:
            return {
                "text": f"Transcription demo: {str(e)[:50]}",
                "confidence": 0.5,
                "language": "en"
            }
    
    async def synthesize(self, text: str, language: str = "en") -> bytes:
        """
        UC-8: Text-to-Speech
        Convert text to speech audio
        """
        try:
            from gtts import gTTS
            
            tts = gTTS(text=text, lang=language)
            
            # Save to bytes
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            return audio_buffer.read()
            
        except ImportError:
            # Return empty audio if gTTS not installed
            return b""
        except Exception:
            return b""
    
    async def process_command(self, text: str) -> Dict[str, Any]:
        """
        Process voice command and determine intent
        """
        text_lower = text.lower()
        
        # Simple intent detection
        if any(word in text_lower for word in ["find", "search", "look for"]):
            intent = "search"
            action = "Searching CRM database"
        elif any(word in text_lower for word in ["create", "add", "new"]):
            intent = "create"
            action = "Creating new record"
        elif any(word in text_lower for word in ["update", "change", "modify"]):
            intent = "update"
            action = "Updating record"
        elif any(word in text_lower for word in ["show", "display", "list"]):
            intent = "list"
            action = "Retrieving data"
        elif any(word in text_lower for word in ["call", "phone", "dial"]):
            intent = "call"
            action = "Initiating call"
        elif any(word in text_lower for word in ["email", "send", "message"]):
            intent = "email"
            action = "Preparing email"
        else:
            intent = "query"
            action = "Processing query"
        
        return {
            "intent": intent,
            "action": action,
            "response": f"Understood. {action} based on your request: '{text}'"
        }

