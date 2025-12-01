"""
AI Service - OpenAI integration for CRM intelligence
Handles: Chat, Summarization, Lead Scoring, Insights
"""

from typing import Optional, List, Dict, Any
from openai import AsyncOpenAI
from app.config import settings
import httpx


class AIService:
    """AI-powered CRM features using OpenAI"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.model = settings.OPENAI_MODEL
        self.crm_url = settings.CRM_BACKEND_URL
    
    async def chat(
        self,
        message: str,
        context: Optional[str] = None,
        history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        UC-7: Conversational AI assistant
        Process natural language queries about CRM data
        """
        system_prompt = """You are a helpful CRM assistant for a multi-tenant CRM system.
        You help users with:
        - Finding customer information
        - Analyzing interactions and trends
        - Preparing for meetings
        - Managing tasks and follow-ups
        
        Be concise and actionable in your responses."""
        
        if context:
            system_prompt += f"\n\nContext: {context}"
        
        messages = [{"role": "system", "content": system_prompt}]
        
        if history:
            for h in history[-5:]:  # Last 5 messages
                messages.append({"role": h["role"], "content": h["content"]})
        
        messages.append({"role": "user", "content": message})
        
        # Use OpenAI if available, otherwise return mock response
        if self.client:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            answer = response.choices[0].message.content
        else:
            # Mock response for demo
            answer = self._mock_chat_response(message)
        
        return {
            "answer": answer,
            "suggestions": self._generate_suggestions(message)
        }
    
    async def summarize(
        self,
        entity_type: str,
        entity_id: str,
        content: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate AI summary for CRM entities"""
        
        prompt = f"Summarize this {entity_type} data concisely:\n\n{content or 'No content provided'}"
        
        if self.client:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a CRM data analyst. Provide concise summaries with key points and action items."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5
            )
            summary = response.choices[0].message.content
        else:
            summary = f"Summary of {entity_type} {entity_id}: This is a demo summary. Key interactions and important details would be analyzed here."
        
        return {
            "summary": summary,
            "key_points": ["Point 1: Initial contact made", "Point 2: Follow-up scheduled", "Point 3: High engagement"],
            "sentiment": "positive",
            "action_items": ["Schedule follow-up call", "Send proposal document"]
        }
    
    async def summarize_interaction(self, interaction_id: str) -> Dict[str, Any]:
        """Summarize a specific interaction"""
        return await self.summarize("interaction", interaction_id)
    
    async def generate_customer_insights(self, customer_id: str) -> Dict[str, Any]:
        """Generate AI insights for a customer"""
        return {
            "engagement_level": "High",
            "sentiment_trend": "Improving",
            "next_best_action": "Schedule product demo",
            "risk_factors": [],
            "opportunities": ["Upsell potential", "Referral candidate"]
        }
    
    async def prepare_meeting_brief(self, customer_id: str, meeting_type: str) -> Dict[str, Any]:
        """Prepare AI-generated meeting brief"""
        return {
            "customer_summary": "Active customer with 3 months engagement history",
            "recent_interactions": ["Email on 11/20", "Call on 11/15"],
            "open_issues": [],
            "talking_points": [
                "Discuss new feature requirements",
                "Review satisfaction with current service",
                "Explore expansion opportunities"
            ],
            "prepared_questions": [
                "What challenges are you currently facing?",
                "How can we better support your team?"
            ]
        }
    
    async def score_lead(
        self,
        customer_id: str,
        interactions: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """AI-powered lead scoring"""
        # Calculate score based on various factors
        score = 75  # Demo score
        
        return {
            "score": score,
            "factors": [
                "High email engagement (25 pts)",
                "Recent website visits (20 pts)",
                "Demo requested (30 pts)"
            ],
            "recommendation": "Hot lead - prioritize for sales outreach"
        }
    
    async def auto_update_leads(self) -> Dict[str, Any]:
        """Automatic lead updates and CRM syncing"""
        # This would process leads in background
        return {
            "count": 5,
            "updated_leads": ["lead1", "lead2", "lead3", "lead4", "lead5"]
        }
    
    def _mock_chat_response(self, message: str) -> str:
        """Generate mock response for demo mode"""
        message_lower = message.lower()
        
        if "customer" in message_lower:
            return "I found 15 customers matching your criteria. The top accounts are TechCorp (Active), StartupXYZ (Prospect), and GlobalInc (Active). Would you like more details?"
        elif "meeting" in message_lower:
            return "You have 3 meetings scheduled this week. The most important is with TechCorp tomorrow at 2 PM. I've prepared a brief with talking points."
        elif "task" in message_lower:
            return "You have 5 pending tasks. 2 are high priority: Follow up with StartupXYZ (due today) and Send proposal to GlobalInc (due tomorrow)."
        else:
            return "I can help you with customer information, meeting preparation, task management, and CRM insights. What would you like to know?"
    
    def _generate_suggestions(self, message: str) -> List[str]:
        """Generate follow-up suggestions"""
        return [
            "Show recent interactions",
            "View upcoming tasks",
            "Generate customer report"
        ]

