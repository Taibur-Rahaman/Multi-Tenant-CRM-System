"""Tenant Context Middleware"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from contextvars import ContextVar

# Context variable for tenant ID
tenant_context: ContextVar[str] = ContextVar("tenant_id", default=None)


class TenantMiddleware(BaseHTTPMiddleware):
    """Middleware for setting tenant context"""
    
    async def dispatch(self, request: Request, call_next):
        tenant_id = getattr(request.state, "tenant_id", None)
        
        if tenant_id:
            token = tenant_context.set(tenant_id)
            try:
                response = await call_next(request)
            finally:
                tenant_context.reset(token)
        else:
            response = await call_next(request)
        
        return response


def get_current_tenant() -> str:
    """Get current tenant ID from context"""
    return tenant_context.get()

