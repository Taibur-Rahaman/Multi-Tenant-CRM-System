# Multi-Tenant CRM System - API Documentation

Base URL: `http://localhost:8080/api`

## Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@demo.com",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "550e8400-e29b-41d4-a716...",
    "tokenType": "Bearer",
    "expiresIn": 900000,
    "user": {
      "id": "uuid",
      "email": "admin@demo.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN"
    }
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "550e8400-e29b-41d4-a716..."
}
```

---

## Customers

### List Customers
```http
GET /customers?page=0&size=20
Authorization: Bearer {token}
```

### Get Customer
```http
GET /customers/{id}
Authorization: Bearer {token}
```

### Create Customer
```http
POST /customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "jobTitle": "CTO",
  "accountId": "uuid",
  "leadStatus": "new",
  "tags": ["enterprise", "tech"]
}
```

### Update Customer
```http
PUT /customers/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "leadStatus": "qualified",
  "leadScore": 75
}
```

### Delete Customer
```http
DELETE /customers/{id}
Authorization: Bearer {token}
```

### Search Customers
```http
GET /customers/search?q=john
Authorization: Bearer {token}
```

---

## Accounts

### List Accounts
```http
GET /accounts?page=0&size=20
Authorization: Bearer {token}
```

### Create Account
```http
POST /accounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Acme Corporation",
  "industry": "Technology",
  "website": "https://acme.com",
  "phone": "+1-555-0100",
  "city": "San Francisco",
  "country": "USA"
}
```

---

## Interactions

### List Interactions
```http
GET /interactions?page=0&size=20
Authorization: Bearer {token}
```

### Get Interactions by Customer
```http
GET /interactions/customer/{customerId}
Authorization: Bearer {token}
```

### Create Interaction
```http
POST /interactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "uuid",
  "type": "CALL",
  "direction": "OUTBOUND",
  "subject": "Discovery Call",
  "description": "Discussed requirements and pricing",
  "durationSeconds": 1800
}
```

### Filter by Type
```http
GET /interactions/type/CALL
Authorization: Bearer {token}
```

### Filter by Date Range
```http
GET /interactions/date-range?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z
Authorization: Bearer {token}
```

---

## Tasks

### List Tasks
```http
GET /tasks?page=0&size=20
Authorization: Bearer {token}
```

### Get My Tasks
```http
GET /tasks/my-tasks
Authorization: Bearer {token}
```

### Create Task
```http
POST /tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Follow up with Acme",
  "description": "Send proposal document",
  "priority": "high",
  "dueDate": "2024-01-15T10:00:00Z",
  "customerId": "uuid"
}
```

### Complete Task
```http
POST /tasks/{id}/complete
Authorization: Bearer {token}
```

---

## Dashboard

### Get Statistics
```http
GET /dashboard/stats
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "totalCustomers": 150,
    "totalLeads": 45,
    "totalAccounts": 32,
    "totalInteractions": 520,
    "recentInteractions": 28,
    "totalTasks": 89,
    "pendingTasks": 12,
    "interactionsByType": {
      "CALL": 120,
      "EMAIL": 280,
      "MEETING": 85,
      "MESSAGE": 35
    }
  }
}
```

---

## AI Service Endpoints

Base URL: `http://localhost:8001`

### Chat with AI
```http
POST /chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "What are my pending tasks?",
  "conversation_history": []
}
```

### Summarize Entity
```http
POST /summarize/entity
Authorization: Bearer {token}
Content-Type: application/json

{
  "entity_type": "customer",
  "entity_id": "uuid"
}
```

### Meeting Preparation
```http
POST /summarize/meeting-prep
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_id": "uuid",
  "meeting_context": "Quarterly review"
}
```

### Transcribe Audio
```http
POST /voice/transcribe
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: audio.mp3
language: en (optional)
```

### Text-to-Speech
```http
POST /voice/synthesize
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Hello, this is a test message",
  "language": "en"
}
```

### Get Customer Insights
```http
GET /insights/customer/{customerId}
Authorization: Bearer {token}
```

### Lead Scoring
```http
GET /insights/leads/scoring?limit=20
Authorization: Bearer {token}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional details"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Common Error Codes
| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 500 | Internal Error | Server error |

