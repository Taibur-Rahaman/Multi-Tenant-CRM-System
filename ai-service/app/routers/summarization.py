"""Summarization Router - AI-powered content summarization"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

from app.middleware.auth import get_current_user
from app.services.llm_service import LLMService
from app.services.crm_client import CRMClient

router = APIRouter()
logger = logging.getLogger(__name__)

llm_service = LLMService()
crm_client = CRMClient()


class SummarizeRequest(BaseModel):
    entity_type: str  # email, meeting, interaction, customer
    entity_id: str
    options: Optional[Dict[str, Any]] = None


class SummarizeResponse(BaseModel):
    success: bool
    data: Dict[str, Any]


@router.post("/entity", response_model=SummarizeResponse)
async def summarize_entity(
    request: SummarizeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Summarize a CRM entity (email, meeting, interaction, customer)"""
    try:
        tenant_id = current_user["tenant_id"]
        
        if request.entity_type == "interaction":
            entity = await crm_client.get_interaction(request.entity_id, tenant_id)
            prompt = f"""Summarize this customer interaction:

Type: {entity.get('type')}
Subject: {entity.get('subject')}
Description: {entity.get('description')}
Duration: {entity.get('durationSeconds', 0)} seconds

Provide a concise summary including:
1. Main topic/purpose
2. Key points discussed
3. Action items (if any)
4. Sentiment/tone"""

        elif request.entity_type == "customer":
            entity = await crm_client.get_customer(request.entity_id, tenant_id)
            interactions = await crm_client.get_customer_interactions(
                request.entity_id, tenant_id, limit=10
            )
            
            prompt = f"""Create a comprehensive customer summary:

Customer: {entity.get('fullName')}
Company: {entity.get('accountName', 'N/A')}
Status: {entity.get('leadStatus')}
Score: {entity.get('leadScore')}

Recent Interactions ({len(interactions)}):
{interactions}

Provide:
1. Customer profile overview
2. Engagement summary
3. Relationship health assessment
4. Recommended next steps"""

        elif request.entity_type == "meeting":
            # Get meeting/calendar event
            entity = await crm_client.get_interaction(request.entity_id, tenant_id)
            prompt = f"""Summarize this meeting:

Title: {entity.get('subject')}
Date: {entity.get('scheduledAt')}
Duration: {entity.get('durationSeconds', 0) // 60} minutes
Notes: {entity.get('description')}

Provide:
1. Meeting purpose
2. Key discussion points
3. Decisions made
4. Action items with owners"""

        else:
            raise HTTPException(status_code=400, detail=f"Unknown entity type: {request.entity_type}")
        
        summary = await llm_service.generate_text(prompt)
        
        # Analyze sentiment
        sentiment = await llm_service.analyze_sentiment(entity.get('description', ''))
        
        return SummarizeResponse(
            success=True,
            data={
                "summary": summary,
                "sentiment": sentiment,
                "entity_type": request.entity_type,
                "entity_id": request.entity_id
            }
        )
    
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate summary"
        )


@router.post("/bulk")
async def summarize_bulk(
    entity_type: str,
    entity_ids: List[str],
    current_user: dict = Depends(get_current_user)
):
    """Summarize multiple entities at once"""
    summaries = []
    for entity_id in entity_ids[:10]:  # Limit to 10
        try:
            result = await summarize_entity(
                SummarizeRequest(entity_type=entity_type, entity_id=entity_id),
                current_user
            )
            summaries.append(result.data)
        except Exception as e:
            logger.error(f"Error summarizing {entity_id}: {e}")
            summaries.append({"entity_id": entity_id, "error": str(e)})
    
    return {"success": True, "data": {"summaries": summaries}}


@router.post("/meeting-prep")
async def meeting_preparation(
    customer_id: str,
    meeting_context: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Generate meeting preparation notes for a customer"""
    try:
        tenant_id = current_user["tenant_id"]
        
        # Get customer data
        customer = await crm_client.get_customer(customer_id, tenant_id)
        interactions = await crm_client.get_customer_interactions(customer_id, tenant_id, limit=10)
        
        prompt = f"""Prepare comprehensive meeting notes for this customer:

Customer: {customer.get('fullName')}
Title: {customer.get('jobTitle')}
Company: {customer.get('accountName')}
Status: {customer.get('leadStatus')}
Last Contact: {customer.get('lastContactedAt')}

Recent Interactions:
{interactions}

Meeting Context: {meeting_context or 'General check-in'}

Generate:
1. Customer Background Summary
2. Previous Interaction Highlights
3. Key Topics to Discuss
4. Potential Pain Points
5. Questions to Ask
6. Talking Points
7. Recommended Next Steps"""

        prep_notes = await llm_service.generate_text(prompt)
        
        return {
            "success": True,
            "data": {
                "customer_id": customer_id,
                "customer_name": customer.get('fullName'),
                "preparation_notes": prep_notes
            }
        }
    
    except Exception as e:
        logger.error(f"Meeting prep error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate meeting prep")

