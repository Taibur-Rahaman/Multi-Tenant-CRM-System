"""JWT Authentication Middleware"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Paths that don't require authentication
PUBLIC_PATHS = ["/", "/health", "/docs", "/redoc", "/openapi.json"]


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """Middleware for JWT token validation"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for public paths
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)
        
        # Get token from header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            # Allow request to proceed, individual endpoints will handle auth
            request.state.user = None
            request.state.tenant_id = None
            return await call_next(request)
        
        token = auth_header.split(" ")[1]
        
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            request.state.user_id = payload.get("sub")
            request.state.tenant_id = payload.get("tenantId")
            request.state.email = payload.get("email")
        except JWTError as e:
            logger.warning(f"JWT validation failed: {e}")
            request.state.user = None
            request.state.tenant_id = None
        
        return await call_next(request)


def get_current_user(request: Request):
    """Dependency to get current user from request"""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return {
        "user_id": user_id,
        "tenant_id": getattr(request.state, "tenant_id", None),
        "email": getattr(request.state, "email", None)
    }

