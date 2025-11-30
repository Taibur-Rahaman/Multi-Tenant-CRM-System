"""LLM Service - OpenAI integration for text generation"""

from openai import AsyncOpenAI
from app.config import settings
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with OpenAI LLMs"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
    
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """Generate chat completion"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Chat completion error: {e}")
            raise
    
    async def generate_text(
        self, 
        prompt: str, 
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """Generate text from prompt"""
        messages = [{"role": "user", "content": prompt}]
        return await self.chat_completion(messages, temperature, max_tokens)
    
    async def generate_json(
        self, 
        prompt: str,
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """Generate structured JSON response"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that responds only in valid JSON format."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return {"error": "Failed to parse JSON response"}
        except Exception as e:
            logger.error(f"JSON generation error: {e}")
            raise
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of text"""
        if not text or len(text.strip()) < 10:
            return {"sentiment": "neutral", "score": 0, "confidence": 0}
        
        prompt = f"""Analyze the sentiment of this text:
"{text[:1000]}"

Respond in JSON:
{{
  "sentiment": "positive/neutral/negative",
  "score": -1.0 to 1.0,
  "confidence": 0.0 to 1.0,
  "emotions": ["detected emotions"]
}}"""
        
        return await self.generate_json(prompt)
    
    async def extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract named entities from text"""
        prompt = f"""Extract entities from this text:
"{text[:1000]}"

Respond in JSON:
{{
  "people": ["name1", "name2"],
  "companies": ["company1"],
  "emails": ["email1"],
  "phones": ["phone1"],
  "dates": ["date1"],
  "locations": ["location1"],
  "topics": ["topic1", "topic2"]
}}"""
        
        return await self.generate_json(prompt)
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate text embedding for semantic search"""
        try:
            response = await self.client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            raise

