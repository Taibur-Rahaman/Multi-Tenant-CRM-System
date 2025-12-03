"""
Summarization Router - Auto-summarization and insights
AI-driven orchestration for summarization
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


class SummaryRequest(BaseModel):
    entity_type: str  # "customer", "interaction", "meeting", "email"
    entity_id: str
    content: Optional[str] = None


class SummaryResponse(BaseModel):
    summary: str
    key_points: List[str]
    sentiment: Optional[str] = None
    action_items: Optional[List[str]] = []


class LeadScoreRequest(BaseModel):
    customer_id: str
    interactions: Optional[List[dict]] = []


class LeadScoreResponse(BaseModel):
    customer_id: str
    score: int  # 0-100
    factors: List[str]
    recommendation: str


@router.post("/generate", response_model=SummaryResponse)
async def generate_summary(request: SummaryRequest):
    """
    Generate AI summary for any CRM entity
    - Customer profiles
    - Interactions
    - Meetings
    - Email threads
    """
    try:
        result = await ai_service.summarize(
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            content=request.content
        )
        return SummaryResponse(
            summary=result["summary"],
            key_points=result.get("key_points", []),
            sentiment=result.get("sentiment"),
            action_items=result.get("action_items", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interaction")
async def summarize_interaction(interaction_id: str):
    """Summarize a specific interaction (call, meeting, email)"""
    try:
        summary = await ai_service.summarize_interaction(interaction_id)
        return {"interaction_id": interaction_id, **summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/lead-score", response_model=LeadScoreResponse)
async def calculate_lead_score(request: LeadScoreRequest):
    """
    AI-powered lead scoring
    Analyze customer data and interactions to score leads
    """
    try:
        result = await ai_service.score_lead(
            customer_id=request.customer_id,
            interactions=request.interactions
        )
        return LeadScoreResponse(
            customer_id=request.customer_id,
            score=result["score"],
            factors=result["factors"],
            recommendation=result["recommendation"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auto-update")
async def auto_update_leads():
    """
    Automatic lead updates and CRM syncing
    Continuously process and update lead information
    """
    try:
        result = await ai_service.auto_update_leads()
        return {"status": "success", "updated_count": result.get("count", 0)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

