#!/usr/bin/env python3
"""
NeoBit CRM - Mock API Server
Quick demo server to test API endpoints
"""

from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import uvicorn
import uuid
import json
import secrets
from urllib.parse import unquote

app = FastAPI(
    title="NeoBit CRM API",
    description="Multi-Tenant CRM System API",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data
USERS = {
    "vendor@demo.com": {
        "id": "00000000-0000-0000-0000-000000000002",
        "email": "vendor@demo.com",
        "name": "Demo Vendor",
        "role": "VENDOR_ADMIN",
        "tenantId": "00000000-0000-0000-0000-000000000002",
        "tenantName": "Demo Company"
    },
    "agent@demo.com": {
        "id": "00000000-0000-0000-0000-000000000003",
        "email": "agent@demo.com",
        "name": "Demo Agent",
        "role": "AGENT",
        "tenantId": "00000000-0000-0000-0000-000000000002",
        "tenantName": "Demo Company"
    }
}

# Secure token storage (one-time codes)
# In production, use Redis or database with TTL
OAUTH_TOKENS = {}  # {code: {token, user, expires_at}}

CUSTOMERS = [
    {
        "id": "00000000-0000-0000-0000-000000000010",
        "name": "John Doe",
        "email": "john@customer.com",
        "phone": "+8801712345678",
        "company": "Customer Corp",
        "tags": ["vip", "enterprise"],
        "createdAt": "2024-01-01T00:00:00Z"
    },
    {
        "id": "00000000-0000-0000-0000-000000000011",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+8801798765432",
        "company": "Example Inc",
        "tags": ["new", "lead"],
        "createdAt": "2024-01-05T00:00:00Z"
    }
]

INTERACTIONS = [
    {
        "id": str(uuid.uuid4()),
        "type": "EMAIL",
        "channel": "GMAIL",
        "direction": "INBOUND",
        "subject": "Product Inquiry",
        "content": "Hi, I'm interested in your enterprise plan...",
        "customerId": "00000000-0000-0000-0000-000000000010",
        "customerName": "John Doe",
        "createdAt": "2024-01-15T10:30:00Z"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "NOTE",
        "channel": "MANUAL",
        "direction": "INTERNAL",
        "subject": "Meeting Notes",
        "content": "Discussed Q2 requirements. Customer needs mobile integration.",
        "customerId": "00000000-0000-0000-0000-000000000010",
        "customerName": "John Doe",
        "createdAt": "2024-01-14T15:30:00Z"
    }
]

# Request/Response Models
class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "Bearer"
    expiresIn: int = 900
    user: dict

class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    tags: Optional[List[str]] = []

class InteractionCreate(BaseModel):
    type: str
    customerId: str
    subject: Optional[str] = None
    content: str

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Auth endpoints
@app.post("/api/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Login with email and password"""
    if request.email not in USERS:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # For demo, accept any password
    user = USERS[request.email]
    return AuthResponse(
        accessToken=f"mock-token-{uuid.uuid4()}",
        refreshToken=f"mock-refresh-{uuid.uuid4()}",
        user=user
    )

async def _exchange_code(code: str):
    """Internal function to exchange code for token"""
    print(f"[DEBUG] Exchange request for code: {code[:20] if len(code) > 20 else code}...")
    print(f"[DEBUG] Available codes: {len(OAUTH_TOKENS)}")
    
    if code not in OAUTH_TOKENS:
        # Clean up expired codes
        expired = [k for k, v in OAUTH_TOKENS.items() if datetime.utcnow() > v["expires_at"]]
        for k in expired:
            del OAUTH_TOKENS[k]
        
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid or expired code. Available codes: {len(OAUTH_TOKENS)}"
        )
    
    token_data = OAUTH_TOKENS[code]
    
    # Check expiry
    if datetime.utcnow() > token_data["expires_at"]:
        del OAUTH_TOKENS[code]
        raise HTTPException(status_code=400, detail="Code expired")
    
    # Get token and user
    token = token_data["token"]
    user = token_data["user"]
    
    # Delete code (one-time use)
    del OAUTH_TOKENS[code]
    
    print(f"[DEBUG] Exchange successful for user: {user.get('email', 'unknown')}")
    
    return {
        "accessToken": token,
        "tokenType": "Bearer",
        "expiresIn": 900,
        "user": user
    }

@app.post("/api/auth/exchange")
async def exchange_oauth_code_post(code: str = Query(...)):
    """Exchange one-time OAuth code for token (POST method)"""
    return await _exchange_code(code)

@app.get("/api/auth/exchange")
async def exchange_oauth_code_get(code: str = Query(...)):
    """Exchange one-time OAuth code for token (GET method - for testing)"""
    return await _exchange_code(code)

@app.get("/api/auth/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user profile"""
    # For demo, return default user if no token provided
    if not authorization:
        return USERS.get("vendor@demo.com")
    
    # Extract token from "Bearer <token>"
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    # Mock: validate token and return user
    # In production, decode JWT and get user from DB
    if token.startswith("mock-token-") or token.startswith("oauth-token-"):
        return USERS.get("vendor@demo.com")
    
    raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/auth/google/callback")
async def google_oauth_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None)
):
    """Handle Google OAuth callback"""
    if error:
        # Redirect to frontend with error
        frontend_url = "http://localhost:3000"
        if state:
            try:
                state_data = json.loads(unquote(state))
                frontend_url = state_data.get("frontend", "http://localhost:3000")
            except:
                pass
        return RedirectResponse(url=f"{frontend_url}?error={error}")
    
    if not code:
        return RedirectResponse(url="http://localhost:3000?error=no_code")
    
    # Mock: Exchange code for token
    # In production, make POST request to Google token endpoint
    # POST https://oauth2.googleapis.com/token
    # with client_id, client_secret, code, redirect_uri, grant_type=authorization_code
    
    # For demo, generate a mock token
    mock_token = f"oauth-token-google-{uuid.uuid4()}"
    
    # Parse state to get frontend URL and role
    frontend_url = "http://localhost:3000"
    role = "VENDOR_ADMIN"
    if state:
        try:
            state_data = json.loads(unquote(state))
            frontend_url = state_data.get("frontend", "http://localhost:3000")
            role = state_data.get("role", "VENDOR_ADMIN")
        except:
            pass
    
    # Mock user data (in production, fetch from Google API)
    mock_user = {
        "id": f"google-{uuid.uuid4()}",
        "email": "user@gmail.com",
        "name": "Google User",
        "role": role,
        "tenantId": f"tenant-{uuid.uuid4()}",
        "tenantName": "Google Company",
        "provider": "google"
    }
    
    # Generate secure one-time code (instead of putting token in URL)
    exchange_code = secrets.token_urlsafe(32)
    OAUTH_TOKENS[exchange_code] = {
        "token": mock_token,
        "user": mock_user,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)  # 5 min expiry
    }
    
    print(f"[OAuth] Generated code for Google: {exchange_code[:20]}...")
    print(f"[OAuth] Total codes stored: {len(OAUTH_TOKENS)}")
    print(f"[OAuth] Redirecting to: {frontend_url}?code={exchange_code[:20]}...")
    
    # Redirect to frontend with one-time code (NOT token)
    return RedirectResponse(
        url=f"{frontend_url}?code={exchange_code}&provider=google"
    )

@app.get("/api/auth/github/callback")
async def github_oauth_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None)
):
    """Handle GitHub OAuth callback"""
    if error:
        # Redirect to frontend with error
        frontend_url = "http://localhost:3000"
        if state:
            try:
                state_data = json.loads(unquote(state))
                frontend_url = state_data.get("frontend", "http://localhost:3000")
            except:
                pass
        return RedirectResponse(url=f"{frontend_url}?error={error}")
    
    if not code:
        return RedirectResponse(url="http://localhost:3000?error=no_code")
    
    # Mock: Exchange code for token
    # In production, make POST request to GitHub token endpoint
    # POST https://github.com/login/oauth/access_token
    # with client_id, client_secret, code
    
    # For demo, generate a mock token
    mock_token = f"oauth-token-github-{uuid.uuid4()}"
    
    # Parse state to get frontend URL and role
    frontend_url = "http://localhost:3000"
    role = "VENDOR_ADMIN"
    if state:
        try:
            state_data = json.loads(unquote(state))
            frontend_url = state_data.get("frontend", "http://localhost:3000")
            role = state_data.get("role", "VENDOR_ADMIN")
        except:
            pass
    
    # Mock user data (in production, fetch from GitHub API)
    mock_user = {
        "id": f"github-{uuid.uuid4()}",
        "email": "user@github.com",
        "name": "GitHub User",
        "role": role,
        "tenantId": f"tenant-{uuid.uuid4()}",
        "tenantName": "GitHub Company",
        "provider": "github"
    }
    
    # Generate secure one-time code (instead of putting token in URL)
    exchange_code = secrets.token_urlsafe(32)
    OAUTH_TOKENS[exchange_code] = {
        "token": mock_token,
        "user": mock_user,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)  # 5 min expiry
    }
    
    print(f"[OAuth] Generated code for GitHub: {exchange_code[:20]}...")
    print(f"[OAuth] Total codes stored: {len(OAUTH_TOKENS)}")
    print(f"[OAuth] Redirecting to: {frontend_url}?code={exchange_code[:20]}...")
    
    # Redirect to frontend with one-time code (NOT token)
    return RedirectResponse(
        url=f"{frontend_url}?code={exchange_code}&provider=github"
    )

# Customer endpoints
@app.get("/api/customers")
async def list_customers(
    page: int = 0,
    size: int = 20,
    search: Optional[str] = None
):
    """List customers with pagination"""
    filtered = CUSTOMERS
    if search:
        filtered = [c for c in CUSTOMERS if search.lower() in c["name"].lower()]
    
    return {
        "content": filtered,
        "page": page,
        "size": size,
        "totalElements": len(filtered),
        "totalPages": 1
    }

@app.get("/api/customers/{customer_id}")
async def get_customer(customer_id: str):
    """Get customer by ID"""
    for customer in CUSTOMERS:
        if customer["id"] == customer_id:
            return customer
    raise HTTPException(status_code=404, detail="Customer not found")

@app.post("/api/customers", status_code=201)
async def create_customer(customer: CustomerCreate):
    """Create new customer"""
    new_customer = {
        "id": str(uuid.uuid4()),
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "company": customer.company,
        "tags": customer.tags or [],
        "createdAt": datetime.utcnow().isoformat()
    }
    CUSTOMERS.append(new_customer)
    return new_customer

# Interaction endpoints
@app.get("/api/interactions")
async def list_interactions(
    page: int = 0,
    size: int = 20,
    customerId: Optional[str] = None
):
    """List interactions"""
    filtered = INTERACTIONS
    if customerId:
        filtered = [i for i in INTERACTIONS if i["customerId"] == customerId]
    
    return {
        "content": filtered,
        "page": page,
        "size": size,
        "totalElements": len(filtered),
        "totalPages": 1
    }

@app.post("/api/interactions", status_code=201)
async def create_interaction(interaction: InteractionCreate):
    """Create new interaction"""
    new_interaction = {
        "id": str(uuid.uuid4()),
        "type": interaction.type,
        "channel": "MANUAL",
        "direction": "INTERNAL",
        "subject": interaction.subject,
        "content": interaction.content,
        "customerId": interaction.customerId,
        "createdAt": datetime.utcnow().isoformat()
    }
    INTERACTIONS.append(new_interaction)
    return new_interaction

# Integration endpoints
@app.get("/api/integrations")
async def list_integrations():
    """List configured integrations"""
    return {
        "integrations": [
            {"type": "GMAIL", "status": "DISCONNECTED"},
            {"type": "GOOGLE_CALENDAR", "status": "DISCONNECTED"},
            {"type": "TELEGRAM", "status": "DISCONNECTED"},
            {"type": "CLICKUP", "status": "DISCONNECTED"},
            {"type": "ZEGO", "status": "ACTIVE"}
        ]
    }

# Reports endpoint
@app.get("/api/reports/dashboard")
async def get_dashboard():
    """Get dashboard statistics"""
    return {
        "customers": {"total": len(CUSTOMERS), "new": 1},
        "interactions": {"total": len(INTERACTIONS), "byType": {"EMAIL": 1, "NOTE": 1}},
        "responseTime": {"average": "2h 15m"}
    }

# Swagger redirect
@app.get("/swagger-ui.html")
async def swagger_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")

if __name__ == "__main__":
    print("🚀 Starting NeoBit CRM Mock API Server...")
    print("📚 API Docs: http://localhost:8080/docs")
    print("🔧 Health: http://localhost:8080/health")
    uvicorn.run(app, host="0.0.0.0", port=8080)

