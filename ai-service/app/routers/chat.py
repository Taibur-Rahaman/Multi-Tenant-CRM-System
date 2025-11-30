"""Chat Router - Conversational AI Assistant"""

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


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    success: bool
    data: Dict[str, Any]


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Chat with AI assistant about CRM data.
    Supports multi-turn conversations with context.
    """
    try:
        # Build conversation context
        system_prompt = """You are an intelligent CRM assistant. You help users with:
- Finding and analyzing customer information
- Summarizing interactions and meetings
- Providing insights on leads and opportunities
- Creating tasks and follow-ups
- Answering questions about their CRM data

Be concise, helpful, and professional. If you need more information to help, ask clarifying questions.
When providing data, format it clearly and highlight key insights."""

        # Get relevant CRM context if needed
        crm_context = ""
        if request.context:
            if "customer_id" in request.context:
                customer_data = await crm_client.get_customer(
                    request.context["customer_id"],
                    current_user["tenant_id"]
                )
                if customer_data:
                    crm_context += f"\nCustomer context: {customer_data}"
            
            if "recent_interactions" in request.context:
                interactions = await crm_client.get_recent_interactions(
                    current_user["tenant_id"],
                    limit=5
                )
                if interactions:
                    crm_context += f"\nRecent interactions: {interactions}"

        # Build messages for LLM
        messages = [{"role": "system", "content": system_prompt + crm_context}]
        
        # Add conversation history
        for msg in request.conversation_history[-10:]:  # Keep last 10 messages
            messages.append({"role": msg.role, "content": msg.content})
        
        # Add current message
        messages.append({"role": "user", "content": request.message})
        
        # Get AI response
        response = await llm_service.chat_completion(messages)
        
        return ChatResponse(
            success=True,
            data={
                "response": response,
                "conversation_id": current_user["user_id"]
            }
        )
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat request"
        )


@router.post("/quick-action")
async def quick_action(
    action: str,
    params: Optional[Dict[str, Any]] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Execute quick AI actions like:
    - summarize_customer: Summarize a customer's history
    - suggest_followup: Suggest follow-up actions
    - analyze_sentiment: Analyze interaction sentiment
    """
    try:
        params = params or {}
        
        if action == "summarize_customer":
            customer_id = params.get("customer_id")
            if not customer_id:
                raise HTTPException(status_code=400, detail="customer_id required")
            
            customer = await crm_client.get_customer(customer_id, current_user["tenant_id"])
            interactions = await crm_client.get_customer_interactions(
                customer_id, current_user["tenant_id"]
            )
            
            prompt = f"""Summarize this customer's profile and interaction history:
Customer: {customer}
Interactions: {interactions}

Provide a brief overview including:
1. Customer summary
2. Key interactions
3. Current status/health
4. Recommended next steps"""

            summary = await llm_service.generate_text(prompt)
            return {"success": True, "data": {"summary": summary}}
        
        elif action == "suggest_followup":
            context = params.get("context", "")
            prompt = f"""Based on this context, suggest 3 follow-up actions:
{context}

Format as a numbered list with brief explanations."""

            suggestions = await llm_service.generate_text(prompt)
            return {"success": True, "data": {"suggestions": suggestions}}
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick action error: {e}")
        raise HTTPException(status_code=500, detail="Action failed")

