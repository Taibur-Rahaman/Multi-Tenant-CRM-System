"""
CRM API Client for MCP Server
Handles all HTTP requests to the CRM backend
"""
import httpx
from typing import Optional, Dict, Any, List
from config import settings


class CRMClient:
    """HTTP client for CRM backend API"""
    
    def __init__(self, token: Optional[str] = None, tenant_id: Optional[str] = None):
        self.base_url = settings.CRM_API_URL
        self.token = token or settings.API_TOKEN
        self.tenant_id = tenant_id or settings.TENANT_ID
        self.timeout = settings.CRM_API_TIMEOUT
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if self.tenant_id:
            headers["X-Tenant-ID"] = self.tenant_id
        return headers
    
    async def _request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to CRM API"""
        url = f"{self.base_url}{endpoint}"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=self._get_headers(),
                json=data,
                params=params
            )
            response.raise_for_status()
            return response.json()
    
    # ==================== Customers ====================
    
    async def list_customers(
        self, 
        page: int = 0, 
        size: int = 20,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """List all customers with pagination"""
        params = {"page": page, "size": size}
        if search:
            params["search"] = search
        return await self._request("GET", "/customers", params=params)
    
    async def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """Get customer by ID"""
        return await self._request("GET", f"/customers/{customer_id}")
    
    async def create_customer(
        self,
        name: str,
        email: str,
        phone: Optional[str] = None,
        company: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new customer"""
        data = {
            "name": name,
            "email": email,
            "phone": phone,
            "company": company,
            "notes": notes
        }
        return await self._request("POST", "/customers", data=data)
    
    async def update_customer(
        self,
        customer_id: str,
        **updates
    ) -> Dict[str, Any]:
        """Update customer details"""
        return await self._request("PUT", f"/customers/{customer_id}", data=updates)
    
    async def search_customers(self, query: str) -> Dict[str, Any]:
        """Search customers by name, email, or company"""
        return await self._request("GET", "/customers/search", params={"q": query})
    
    # ==================== Tasks ====================
    
    async def list_tasks(
        self,
        page: int = 0,
        size: int = 20,
        status: Optional[str] = None,
        priority: Optional[str] = None
    ) -> Dict[str, Any]:
        """List tasks with optional filters"""
        params = {"page": page, "size": size}
        if status:
            params["status"] = status
        if priority:
            params["priority"] = priority
        return await self._request("GET", "/tasks", params=params)
    
    async def get_task(self, task_id: str) -> Dict[str, Any]:
        """Get task by ID"""
        return await self._request("GET", f"/tasks/{task_id}")
    
    async def create_task(
        self,
        title: str,
        description: Optional[str] = None,
        customer_id: Optional[str] = None,
        due_date: Optional[str] = None,
        priority: str = "MEDIUM",
        assigned_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new task"""
        data = {
            "title": title,
            "description": description,
            "customerId": customer_id,
            "dueDate": due_date,
            "priority": priority,
            "assignedTo": assigned_to
        }
        return await self._request("POST", "/tasks", data=data)
    
    async def update_task_status(
        self,
        task_id: str,
        status: str
    ) -> Dict[str, Any]:
        """Update task status"""
        return await self._request("PATCH", f"/tasks/{task_id}/status", data={"status": status})
    
    # ==================== Interactions ====================
    
    async def list_interactions(
        self,
        customer_id: Optional[str] = None,
        page: int = 0,
        size: int = 20
    ) -> Dict[str, Any]:
        """List interactions, optionally filtered by customer"""
        params = {"page": page, "size": size}
        if customer_id:
            params["customerId"] = customer_id
        return await self._request("GET", "/interactions", params=params)
    
    async def create_interaction(
        self,
        customer_id: str,
        interaction_type: str,
        subject: str,
        content: str,
        channel: str = "OTHER"
    ) -> Dict[str, Any]:
        """Log a new interaction with a customer"""
        data = {
            "customerId": customer_id,
            "type": interaction_type,
            "subject": subject,
            "content": content,
            "channel": channel
        }
        return await self._request("POST", "/interactions", data=data)
    
    # ==================== Dashboard ====================
    
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get dashboard statistics"""
        return await self._request("GET", "/dashboard/stats")
    
    async def get_recent_activities(self, limit: int = 10) -> Dict[str, Any]:
        """Get recent activities"""
        return await self._request("GET", "/dashboard/activities", params={"limit": limit})
    
    # ==================== Accounts ====================
    
    async def list_accounts(self, page: int = 0, size: int = 20) -> Dict[str, Any]:
        """List all accounts"""
        return await self._request("GET", "/accounts", params={"page": page, "size": size})
    
    async def get_account(self, account_id: str) -> Dict[str, Any]:
        """Get account by ID"""
        return await self._request("GET", f"/accounts/{account_id}")


# Singleton instance
crm_client = CRMClient()

