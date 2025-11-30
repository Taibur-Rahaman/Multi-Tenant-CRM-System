"""Automation Router - AI-powered automation workflows"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
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


class AutomationRule(BaseModel):
    trigger: str  # email_received, meeting_completed, lead_created
    conditions: Optional[Dict[str, Any]] = None
    action: str  # create_task, update_lead, send_notification, summarize
    action_params: Optional[Dict[str, Any]] = None


class ProcessEmailRequest(BaseModel):
    email_content: str
    from_email: str
    subject: str


@router.post("/process-email")
async def process_incoming_email(
    request: ProcessEmailRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Process incoming email and automatically:
    - Extract entities (customer, company)
    - Detect intent/sentiment
    - Create/update customer record
    - Log as interaction
    - Create follow-up task if needed
    """
    try:
        tenant_id = current_user["tenant_id"]
        
        # Analyze email content
        analysis_prompt = f"""Analyze this incoming email and extract relevant CRM data:

From: {request.from_email}
Subject: {request.subject}
Content: {request.email_content[:2000]}

Provide analysis in JSON:
{{
  "sender_name": "extracted name",
  "company": "extracted company if any",
  "intent": "inquiry/complaint/follow_up/information/other",
  "sentiment": "positive/neutral/negative",
  "priority": "high/medium/low",
  "key_points": ["point1", "point2"],
  "suggested_action": "recommended next step",
  "requires_response": true/false,
  "response_deadline": "if urgent, suggest timeframe"
}}"""

        analysis = await llm_service.generate_json(analysis_prompt)
        
        # Check if customer exists
        existing_customer = await crm_client.find_customer_by_email(
            request.from_email, tenant_id
        )
        
        actions_taken = []
        
        # Create interaction record
        interaction_data = {
            "type": "EMAIL",
            "direction": "INBOUND",
            "subject": request.subject,
            "description": request.email_content[:5000],
            "externalId": request.from_email,
            "externalSource": "email"
        }
        
        if existing_customer:
            interaction_data["customerId"] = existing_customer.get("id")
            actions_taken.append(f"Linked to existing customer: {existing_customer.get('fullName')}")
        else:
            # Create new lead from email
            actions_taken.append("New lead candidate detected")
        
        # If high priority or negative sentiment, create task
        if analysis.get("priority") == "high" or analysis.get("sentiment") == "negative":
            task_title = f"Follow up: {request.subject}"
            if analysis.get("sentiment") == "negative":
                task_title = f"URGENT: Handle complaint - {request.subject}"
            
            actions_taken.append(f"Created follow-up task: {task_title}")
        
        # Generate suggested response if needed
        suggested_response = None
        if analysis.get("requires_response"):
            response_prompt = f"""Generate a professional email response to this:

Original Email:
From: {request.from_email}
Subject: {request.subject}
Content: {request.email_content[:1000]}

Analysis: {analysis}

Generate a brief, professional response addressing the main points."""

            suggested_response = await llm_service.generate_text(response_prompt)
            actions_taken.append("Generated suggested response")
        
        return {
            "success": True,
            "data": {
                "analysis": analysis,
                "existing_customer": existing_customer is not None,
                "actions_taken": actions_taken,
                "suggested_response": suggested_response
            }
        }
    
    except Exception as e:
        logger.error(f"Email processing error: {e}")
        raise HTTPException(status_code=500, detail="Email processing failed")


@router.post("/detect-complaints")
async def detect_complaints(
    current_user: dict = Depends(get_current_user)
):
    """Scan recent interactions for potential complaints"""
    try:
        tenant_id = current_user["tenant_id"]
        
        # Get recent interactions
        interactions = await crm_client.get_recent_interactions(tenant_id, limit=50)
        
        complaints = []
        for interaction in interactions:
            if interaction.get("type") in ["EMAIL", "MESSAGE", "CALL"]:
                content = interaction.get("description", "")
                if len(content) > 50:
                    # Quick sentiment check
                    sentiment = await llm_service.analyze_sentiment(content[:1000])
                    
                    if sentiment.get("sentiment") == "negative" and sentiment.get("score", 0) < -0.5:
                        complaints.append({
                            "interaction_id": interaction.get("id"),
                            "type": interaction.get("type"),
                            "customer_name": interaction.get("customerName"),
                            "subject": interaction.get("subject"),
                            "sentiment_score": sentiment.get("score"),
                            "created_at": interaction.get("createdAt")
                        })
        
        return {
            "success": True,
            "data": {
                "potential_complaints": complaints,
                "total_scanned": len(interactions),
                "complaints_found": len(complaints)
            }
        }
    
    except Exception as e:
        logger.error(f"Complaint detection error: {e}")
        raise HTTPException(status_code=500, detail="Complaint detection failed")


@router.post("/auto-update-fields")
async def auto_update_crm_fields(
    entity_type: str,  # customer or account
    entity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Automatically suggest field updates based on recent interactions"""
    try:
        tenant_id = current_user["tenant_id"]
        
        if entity_type == "customer":
            entity = await crm_client.get_customer(entity_id, tenant_id)
            interactions = await crm_client.get_customer_interactions(entity_id, tenant_id, limit=10)
        else:
            raise HTTPException(status_code=400, detail="Invalid entity type")
        
        prompt = f"""Based on recent interactions, suggest CRM field updates for this customer:

Current Profile:
{entity}

Recent Interactions:
{interactions}

Suggest updates in JSON:
{{
  "suggested_updates": {{
    "leadStatus": "new status if changed",
    "leadScore": "new score (0-100) if justified",
    "tags": ["new tags to add"],
    "notes": "any important notes"
  }},
  "reasoning": ["reason1", "reason2"],
  "confidence": 0-100
}}"""

        suggestions = await llm_service.generate_json(prompt)
        
        return {
            "success": True,
            "data": {
                "entity_id": entity_id,
                "entity_type": entity_type,
                "suggestions": suggestions
            }
        }
    
    except Exception as e:
        logger.error(f"Auto-update error: {e}")
        raise HTTPException(status_code=500, detail="Auto-update failed")

