"""
AI Chat Router - UC-7: Generate AI Summary / Natural Language Queries
Conversational AI assistant for CRM queries
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = []


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    UC-7: Conversational AI assistant
    - Natural language queries about CRM data
    - Meeting preparation insights
    - Customer analysis
    """
    try:
        response = await ai_service.chat(
            message=request.message,
            context=request.context,
            history=request.history
        )
        return ChatResponse(
            response=response["answer"],
            suggestions=response.get("suggestions", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insights")
async def get_insights(customer_id: str):
    """Get AI-generated insights for a customer"""
    try:
        insights = await ai_service.generate_customer_insights(customer_id)
        return {"customer_id": customer_id, "insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/meeting-prep")
async def meeting_preparation(customer_id: str, meeting_type: str = "general"):
    """
    UC-7: AI-driven meeting preparation
    Generate briefing notes before customer meetings
    """
    try:
        prep = await ai_service.prepare_meeting_brief(customer_id, meeting_type)
        return {"customer_id": customer_id, "brief": prep}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

