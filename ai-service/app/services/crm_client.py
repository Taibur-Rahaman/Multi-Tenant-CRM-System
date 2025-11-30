"""CRM Backend Client - HTTP client for CRM API"""

import httpx
from app.config import settings
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class CRMClient:
    """HTTP client for communicating with CRM backend"""
    
    def __init__(self):
        self.base_url = settings.CRM_BACKEND_URL
        self.timeout = 30.0
    
    async def _request(
        self, 
        method: str, 
        path: str, 
        tenant_id: str,
        token: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Make authenticated request to CRM backend"""
        headers = {
            "Content-Type": "application/json",
            "X-Tenant-ID": tenant_id
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(
                    method,
                    f"{self.base_url}{path}",
                    headers=headers,
                    **kwargs
                )
                response.raise_for_status()
                data = response.json()
                return data.get("data", data)
        except httpx.HTTPError as e:
            logger.error(f"CRM API error: {e}")
            return {}
        except Exception as e:
            logger.error(f"CRM client error: {e}")
            return {}
    
    async def get_customer(self, customer_id: str, tenant_id: str) -> Dict[str, Any]:
        """Get customer by ID"""
        return await self._request("GET", f"/customers/{customer_id}", tenant_id)
    
    async def find_customer_by_email(self, email: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Find customer by email"""
        result = await self._request(
            "GET", 
            f"/customers/search?q={email}", 
            tenant_id
        )
        if result and isinstance(result, dict):
            customers = result.get("content", [])
            for customer in customers:
                if customer.get("email", "").lower() == email.lower():
                    return customer
        return None
    
    async def get_customer_interactions(
        self, 
        customer_id: str, 
        tenant_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get interactions for a customer"""
        result = await self._request(
            "GET", 
            f"/interactions/customer/{customer_id}?size={limit}", 
            tenant_id
        )
        if result and isinstance(result, dict):
            return result.get("content", [])
        return []
    
    async def get_interaction(self, interaction_id: str, tenant_id: str) -> Dict[str, Any]:
        """Get interaction by ID"""
        return await self._request("GET", f"/interactions/{interaction_id}", tenant_id)
    
    async def get_recent_interactions(
        self, 
        tenant_id: str, 
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get recent interactions"""
        result = await self._request(
            "GET", 
            f"/interactions?size={limit}&sort=createdAt,desc", 
            tenant_id
        )
        if result and isinstance(result, dict):
            return result.get("content", [])
        return []
    
    async def get_leads(self, tenant_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get leads"""
        result = await self._request(
            "GET", 
            f"/customers/leads?size={limit}", 
            tenant_id
        )
        if result and isinstance(result, dict):
            return result.get("content", [])
        return []
    
    async def get_dashboard_stats(self, tenant_id: str) -> Dict[str, Any]:
        """Get dashboard statistics"""
        return await self._request("GET", "/dashboard/stats", tenant_id)
    
    async def create_interaction(
        self, 
        data: Dict[str, Any], 
        tenant_id: str
    ) -> Dict[str, Any]:
        """Create new interaction"""
        return await self._request("POST", "/interactions", tenant_id, json=data)
    
    async def create_task(
        self, 
        data: Dict[str, Any], 
        tenant_id: str
    ) -> Dict[str, Any]:
        """Create new task"""
        return await self._request("POST", "/tasks", tenant_id, json=data)
    
    async def update_customer(
        self, 
        customer_id: str, 
        data: Dict[str, Any], 
        tenant_id: str
    ) -> Dict[str, Any]:
        """Update customer"""
        return await self._request(
            "PUT", 
            f"/customers/{customer_id}", 
            tenant_id, 
            json=data
        )

