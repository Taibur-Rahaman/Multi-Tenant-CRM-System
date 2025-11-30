"""Insights Router - AI-powered analytics and predictions"""

from fastapi import APIRouter, Depends, HTTPException
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


class InsightResponse(BaseModel):
    success: bool
    data: Dict[str, Any]


@router.get("/customer/{customer_id}", response_model=InsightResponse)
async def get_customer_insights(
    customer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI insights for a specific customer"""
    try:
        tenant_id = current_user["tenant_id"]
        
        # Fetch customer data
        customer = await crm_client.get_customer(customer_id, tenant_id)
        interactions = await crm_client.get_customer_interactions(customer_id, tenant_id, limit=20)
        
        # Generate insights
        prompt = f"""Analyze this customer data and provide actionable insights:

Customer Profile:
- Name: {customer.get('fullName')}
- Company: {customer.get('accountName')}
- Title: {customer.get('jobTitle')}
- Status: {customer.get('leadStatus')}
- Score: {customer.get('leadScore')}
- Last Contact: {customer.get('lastContactedAt')}

Interaction History ({len(interactions)} total):
{interactions[:10]}

Provide insights in JSON format:
{{
  "engagement_score": 0-100,
  "health_status": "healthy/at_risk/critical",
  "sentiment_trend": "positive/neutral/negative",
  "key_insights": ["insight1", "insight2", "insight3"],
  "recommended_actions": ["action1", "action2"],
  "predicted_outcome": "brief prediction",
  "next_best_action": "specific next step"
}}"""

        insights = await llm_service.generate_json(prompt)
        
        return InsightResponse(
            success=True,
            data={
                "customer_id": customer_id,
                "customer_name": customer.get('fullName'),
                "insights": insights
            }
        )
    
    except Exception as e:
        logger.error(f"Customer insights error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate insights")


@router.get("/leads/scoring")
async def lead_scoring(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """AI-powered lead scoring and prioritization"""
    try:
        tenant_id = current_user["tenant_id"]
        
        # Get leads
        leads = await crm_client.get_leads(tenant_id, limit)
        
        if not leads:
            return {"success": True, "data": {"leads": [], "message": "No leads found"}}
        
        # Score each lead
        scored_leads = []
        for lead in leads[:10]:  # Process top 10
            prompt = f"""Score this lead on a scale of 0-100 based on:
- Engagement level
- Company fit
- Decision-making authority
- Budget indicators
- Timeline urgency

Lead: {lead}

Respond in JSON:
{{
  "score": 0-100,
  "factors": ["factor1", "factor2"],
  "recommendation": "brief recommendation"
}}"""
            
            score_result = await llm_service.generate_json(prompt)
            scored_leads.append({
                "id": lead.get('id'),
                "name": lead.get('fullName'),
                "company": lead.get('accountName'),
                "current_status": lead.get('leadStatus'),
                "ai_score": score_result.get('score', 0),
                "factors": score_result.get('factors', []),
                "recommendation": score_result.get('recommendation', '')
            })
        
        # Sort by score
        scored_leads.sort(key=lambda x: x['ai_score'], reverse=True)
        
        return {
            "success": True,
            "data": {
                "scored_leads": scored_leads,
                "total_processed": len(scored_leads)
            }
        }
    
    except Exception as e:
        logger.error(f"Lead scoring error: {e}")
        raise HTTPException(status_code=500, detail="Lead scoring failed")


@router.get("/pipeline/forecast")
async def pipeline_forecast(
    current_user: dict = Depends(get_current_user)
):
    """Forecast pipeline based on current opportunities"""
    try:
        tenant_id = current_user["tenant_id"]
        
        # Get pipeline data
        stats = await crm_client.get_dashboard_stats(tenant_id)
        leads = await crm_client.get_leads(tenant_id, 50)
        
        prompt = f"""Based on this CRM data, provide a pipeline forecast:

Stats:
- Total Customers: {stats.get('totalCustomers', 0)}
- Total Leads: {stats.get('totalLeads', 0)}
- Recent Interactions (7d): {stats.get('recentInteractions', 0)}
- Pending Tasks: {stats.get('pendingTasks', 0)}

Lead Sample: {leads[:10]}

Provide forecast in JSON:
{{
  "forecast_period": "30 days",
  "expected_conversions": number,
  "conversion_probability": 0-100,
  "revenue_potential": "estimated range",
  "risk_factors": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "recommendations": ["rec1", "rec2"]
}}"""

        forecast = await llm_service.generate_json(prompt)
        
        return {
            "success": True,
            "data": {
                "forecast": forecast,
                "generated_at": "now"
            }
        }
    
    except Exception as e:
        logger.error(f"Pipeline forecast error: {e}")
        raise HTTPException(status_code=500, detail="Forecast generation failed")

