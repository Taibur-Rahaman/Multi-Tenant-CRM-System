# NeoBit CRM - API Documentation

> Complete REST API reference for NeoBit Multi-Tenant CRM System

**Base URL:** `https://api.neobit.com/api` (Production) | `http://localhost:8080/api` (Development)

**API Version:** v1

---

## Table of Contents

1. [Authentication](#authentication)
2. [Tenants](#tenants)
3. [Users](#users)
4. [Customers](#customers)
5. [Interactions](#interactions)
6. [Integrations](#integrations)
7. [Search](#search)
8. [Reports](#reports)
9. [AI Assistant](#ai-assistant)
10. [Webhooks](#webhooks)

---

## Authentication

### Headers

All authenticated requests require:

```
Authorization: Bearer <access_token>
Content-Type: application/json
X-Tenant-ID: <tenant_uuid> (optional, defaults to user's tenant)
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/expired token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access token has expired",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/customers"
  }
}
```

---

## 1. Authentication Endpoints

### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "vendor@demo.com",
  "password": "Vendor@123!"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "vendor@demo.com",
    "name": "Demo Vendor",
    "role": "VENDOR_ADMIN",
    "tenantId": "660e8400-e29b-41d4-a716-446655440000",
    "tenantName": "Demo Company"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### GET /auth/oauth/{provider}

Initiate OAuth2 login flow.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| provider | path | `google` or `github` |
| redirect_uri | query | Client callback URL |

**Example:**
```
GET /auth/oauth/google?redirect_uri=http://localhost:3000/oauth/callback
```

**Response (302 Redirect):**
```
Location: https://accounts.google.com/o/oauth2/v2/auth?client_id=...
```

---

### POST /auth/oauth/callback

Exchange OAuth code for tokens.

**Request:**
```json
{
  "provider": "google",
  "code": "4/0AY0e-g7...",
  "redirectUri": "http://localhost:3000/oauth/callback"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "isNewUser": false,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@gmail.com",
    "name": "Google User",
    "avatar": "https://lh3.googleusercontent.com/...",
    "role": "AGENT",
    "tenantId": "660e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Response (401 Unauthorized):**
```json
{
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token is invalid or expired"
  }
}
```

---

### POST /auth/logout

Revoke refresh token and logout.

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response (204 No Content)**

---

### POST /auth/register

Register new user (creates new tenant for VENDOR_ADMIN).

**Request:**
```json
{
  "email": "newvendor@company.com",
  "password": "SecurePass123!",
  "name": "New Vendor",
  "companyName": "New Company Inc",
  "plan": "PROFESSIONAL"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newvendor@company.com",
  "name": "New Vendor",
  "role": "VENDOR_ADMIN",
  "tenant": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "New Company Inc",
    "subdomain": "new-company",
    "plan": "PROFESSIONAL"
  }
}
```

---

## 2. Tenant Endpoints

### GET /tenants

List all tenants (PLATFORM_ADMIN only).

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| page | int | 0 | Page number |
| size | int | 20 | Page size |
| search | string | | Search by name |
| status | string | | Filter by status (ACTIVE, SUSPENDED) |

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Demo Company",
      "subdomain": "demo",
      "plan": "PROFESSIONAL",
      "status": "ACTIVE",
      "userCount": 5,
      "customerCount": 150,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

---

### GET /tenants/{id}

Get tenant details.

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Demo Company",
  "subdomain": "demo",
  "plan": "PROFESSIONAL",
  "status": "ACTIVE",
  "settings": {
    "timezone": "Asia/Dhaka",
    "dateFormat": "DD/MM/YYYY",
    "language": "en"
  },
  "limits": {
    "maxUsers": 10,
    "maxCustomers": 1000,
    "maxStorage": "5GB"
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### PUT /tenants/{id}

Update tenant settings (VENDOR_ADMIN for own tenant, PLATFORM_ADMIN for any).

**Request:**
```json
{
  "name": "Updated Company Name",
  "settings": {
    "timezone": "UTC",
    "dateFormat": "YYYY-MM-DD"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Company Name",
  "subdomain": "demo",
  "settings": {
    "timezone": "UTC",
    "dateFormat": "YYYY-MM-DD",
    "language": "en"
  },
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

---

## 3. User Endpoints

### GET /users

List users in tenant.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| page | int | 0 | Page number |
| size | int | 20 | Page size |
| role | string | | Filter by role |

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "agent@demo.com",
      "name": "Agent User",
      "role": "AGENT",
      "status": "ACTIVE",
      "lastLoginAt": "2024-01-15T09:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 5,
  "totalPages": 1
}
```

---

### POST /users

Create new user in tenant (VENDOR_ADMIN only).

**Request:**
```json
{
  "email": "newagent@demo.com",
  "name": "New Agent",
  "password": "Agent@123!",
  "role": "AGENT"
}
```

**Response (201 Created):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "email": "newagent@demo.com",
  "name": "New Agent",
  "role": "AGENT",
  "status": "ACTIVE",
  "createdAt": "2024-01-15T12:00:00Z"
}
```

---

### GET /users/me

Get current user profile.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "vendor@demo.com",
  "name": "Demo Vendor",
  "avatar": "https://storage.neobit.com/avatars/...",
  "role": "VENDOR_ADMIN",
  "tenant": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Demo Company"
  },
  "preferences": {
    "notifications": true,
    "theme": "dark"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### PUT /users/me

Update current user profile.

**Request:**
```json
{
  "name": "Updated Name",
  "preferences": {
    "notifications": false,
    "theme": "light"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Name",
  "preferences": {
    "notifications": false,
    "theme": "light"
  },
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

---

## 4. Customer Endpoints

### GET /customers

List customers with filtering and pagination.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| page | int | 0 | Page number |
| size | int | 20 | Page size (max 100) |
| sort | string | createdAt,desc | Sort field and direction |
| search | string | | Search in name, email, phone |
| tags | string[] | | Filter by tags |
| assignedTo | uuid | | Filter by assigned agent |

**Example:**
```
GET /customers?page=0&size=10&search=john&sort=name,asc
```

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@customer.com",
      "phone": "+8801712345678",
      "company": "Customer Corp",
      "tags": ["vip", "enterprise"],
      "assignedTo": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Agent User"
      },
      "metadata": {
        "source": "website",
        "industry": "Technology"
      },
      "lastInteractionAt": "2024-01-14T15:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8
}
```

---

### GET /customers/{id}

Get customer details with recent interactions.

**Response (200 OK):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@customer.com",
  "phone": "+8801712345678",
  "company": "Customer Corp",
  "address": {
    "street": "123 Main St",
    "city": "Dhaka",
    "country": "Bangladesh",
    "postalCode": "1205"
  },
  "tags": ["vip", "enterprise"],
  "assignedTo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Agent User",
    "email": "agent@demo.com"
  },
  "metadata": {
    "source": "website",
    "industry": "Technology",
    "customField1": "value1"
  },
  "stats": {
    "totalInteractions": 25,
    "lastInteractionAt": "2024-01-14T15:30:00Z",
    "averageResponseTime": "2h 15m"
  },
  "recentInteractions": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "type": "EMAIL",
      "subject": "Follow-up",
      "createdAt": "2024-01-14T15:30:00Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-14T15:30:00Z"
}
```

---

### POST /customers

Create new customer.

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@newcustomer.com",
  "phone": "+8801798765432",
  "company": "New Customer Inc",
  "address": {
    "street": "456 Business Ave",
    "city": "Chittagong",
    "country": "Bangladesh"
  },
  "tags": ["new", "lead"],
  "assignedTo": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "source": "referral",
    "industry": "Finance"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "name": "Jane Smith",
  "email": "jane@newcustomer.com",
  "phone": "+8801798765432",
  "company": "New Customer Inc",
  "tags": ["new", "lead"],
  "createdAt": "2024-01-15T12:00:00Z"
}
```

---

### PUT /customers/{id}

Update customer.

**Request:**
```json
{
  "name": "Jane Smith-Updated",
  "tags": ["active", "enterprise"],
  "metadata": {
    "source": "referral",
    "industry": "Finance",
    "contractValue": "50000"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "name": "Jane Smith-Updated",
  "email": "jane@newcustomer.com",
  "tags": ["active", "enterprise"],
  "metadata": {
    "source": "referral",
    "industry": "Finance",
    "contractValue": "50000"
  },
  "updatedAt": "2024-01-15T14:00:00Z"
}
```

---

### DELETE /customers/{id}

Delete customer (soft delete).

**Response (204 No Content)**

---

### POST /customers/import

Bulk import customers from CSV.

**Request (multipart/form-data):**
```
file: customers.csv
mapping: {"name": 0, "email": 1, "phone": 2, "company": 3}
skipHeader: true
```

**Response (202 Accepted):**
```json
{
  "importId": "bb0e8400-e29b-41d4-a716-446655440000",
  "status": "PROCESSING",
  "totalRows": 500,
  "message": "Import started. Check status at /customers/import/bb0e8400..."
}
```

---

### GET /customers/export

Export customers to CSV.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| format | string | `csv` or `xlsx` |
| fields | string[] | Fields to export |
| search | string | Filter criteria |

**Response (200 OK):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="customers_2024-01-15.csv"

name,email,phone,company,created_at
John Doe,john@customer.com,+8801712345678,Customer Corp,2024-01-01
...
```

---

## 5. Interaction Endpoints

### GET /interactions

List interactions with filtering.

**Query Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| page | int | 0 | Page number |
| size | int | 20 | Page size |
| customerId | uuid | | Filter by customer |
| type | string | | Filter by type (EMAIL, CALL, CHAT, NOTE) |
| channel | string | | Filter by channel (GMAIL, TELEGRAM, PHONE) |
| startDate | date | | Filter from date |
| endDate | date | | Filter to date |

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "type": "EMAIL",
      "channel": "GMAIL",
      "direction": "INBOUND",
      "subject": "Product Inquiry",
      "content": "Hi, I'm interested in your enterprise plan...",
      "customer": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john@customer.com"
      },
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Agent User"
      },
      "metadata": {
        "gmailMessageId": "msg_abc123",
        "threadId": "thread_xyz789"
      },
      "attachments": [
        {
          "name": "proposal.pdf",
          "size": 245000,
          "url": "https://storage.neobit.com/attachments/..."
        }
      ],
      "createdAt": "2024-01-14T15:30:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 500,
  "totalPages": 25
}
```

---

### GET /interactions/{id}

Get interaction details.

**Response (200 OK):**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "type": "CALL",
  "channel": "ZEGO",
  "direction": "OUTBOUND",
  "subject": "Follow-up Call",
  "content": "Discussed pricing options and next steps.",
  "customer": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe"
  },
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Agent User"
  },
  "metadata": {
    "duration": 1245,
    "recordingUrl": "https://storage.neobit.com/recordings/...",
    "zegoRoomId": "room_abc123"
  },
  "transcription": {
    "status": "COMPLETED",
    "text": "Agent: Hello, this is regarding...\nCustomer: Yes, I was wondering...",
    "summary": "Discussed enterprise pricing. Customer interested in annual plan."
  },
  "createdAt": "2024-01-14T15:30:00Z"
}
```

---

### POST /interactions

Create new interaction.

**Request:**
```json
{
  "type": "NOTE",
  "customerId": "880e8400-e29b-41d4-a716-446655440000",
  "subject": "Meeting Notes",
  "content": "Met with customer to discuss Q2 requirements.\n\n- Need mobile app integration\n- Budget: $50,000\n- Timeline: 3 months",
  "metadata": {
    "meetingDate": "2024-01-15",
    "attendees": ["john@customer.com", "agent@demo.com"]
  }
}
```

**Response (201 Created):**
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440000",
  "type": "NOTE",
  "subject": "Meeting Notes",
  "content": "Met with customer to discuss Q2 requirements...",
  "customer": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe"
  },
  "createdAt": "2024-01-15T12:00:00Z"
}
```

---

### POST /interactions/call

Initiate a call via ZegoCloud.

**Request:**
```json
{
  "customerId": "880e8400-e29b-41d4-a716-446655440000",
  "type": "VOICE",
  "subject": "Sales Call"
}
```

**Response (200 OK):**
```json
{
  "interactionId": "dd0e8400-e29b-41d4-a716-446655440000",
  "roomId": "room_neobit_dd0e8400",
  "token": "04AAAAAGVj...",
  "zegoConfig": {
    "appID": 1934093598,
    "serverWSS": "wss://webliveroom1934093598-api.coolzcloud.com/ws",
    "userID": "550e8400-e29b-41d4-a716-446655440000",
    "userName": "Agent User"
  },
  "customerInviteLink": "https://call.neobit.com/join/room_neobit_dd0e8400"
}
```

---

## 6. Integration Endpoints

### GET /integrations

List configured integrations for tenant.

**Response (200 OK):**
```json
{
  "integrations": [
    {
      "type": "GMAIL",
      "status": "CONNECTED",
      "connectedEmail": "vendor@gmail.com",
      "lastSyncAt": "2024-01-15T10:00:00Z",
      "settings": {
        "autoSync": true,
        "syncInterval": 300,
        "labels": ["INBOX", "SENT"]
      }
    },
    {
      "type": "GOOGLE_CALENDAR",
      "status": "CONNECTED",
      "connectedEmail": "vendor@gmail.com",
      "settings": {
        "defaultCalendar": "primary",
        "syncDays": 30
      }
    },
    {
      "type": "TELEGRAM",
      "status": "CONNECTED",
      "botUsername": "@neobit_demo_bot",
      "webhookUrl": "https://api.neobit.com/webhooks/telegram/660e8400..."
    },
    {
      "type": "CLICKUP",
      "status": "CONNECTED",
      "workspace": "Demo Workspace",
      "defaultList": "CRM Tasks"
    },
    {
      "type": "ZEGO",
      "status": "ACTIVE",
      "settings": {
        "recordCalls": true,
        "transcribeEnabled": true
      }
    }
  ]
}
```

---

### POST /integrations/{type}/connect

Initiate OAuth connection for integration.

**Example:** `POST /integrations/gmail/connect`

**Request:**
```json
{
  "redirectUri": "http://localhost:3000/integrations/callback"
}
```

**Response (200 OK):**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/gmail.readonly...",
  "state": "integration_gmail_660e8400..."
}
```

---

### POST /integrations/{type}/callback

Complete OAuth flow for integration.

**Request:**
```json
{
  "code": "4/0AY0e-g7...",
  "state": "integration_gmail_660e8400..."
}
```

**Response (200 OK):**
```json
{
  "type": "GMAIL",
  "status": "CONNECTED",
  "connectedEmail": "vendor@gmail.com",
  "message": "Gmail integration connected successfully"
}
```

---

### DELETE /integrations/{type}/disconnect

Disconnect integration.

**Response (200 OK):**
```json
{
  "type": "GMAIL",
  "status": "DISCONNECTED",
  "message": "Gmail integration disconnected"
}
```

---

### PUT /integrations/{type}/settings

Update integration settings.

**Request:**
```json
{
  "autoSync": true,
  "syncInterval": 600,
  "labels": ["INBOX", "SENT", "STARRED"]
}
```

**Response (200 OK):**
```json
{
  "type": "GMAIL",
  "settings": {
    "autoSync": true,
    "syncInterval": 600,
    "labels": ["INBOX", "SENT", "STARRED"]
  },
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

---

### POST /integrations/gmail/sync

Trigger manual Gmail sync.

**Response (202 Accepted):**
```json
{
  "syncId": "sync_ee0e8400",
  "status": "IN_PROGRESS",
  "message": "Gmail sync started"
}
```

---

### GET /integrations/calendar/events

List synced calendar events.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| startDate | date | Start of date range |
| endDate | date | End of date range |
| customerId | uuid | Filter by linked customer |

**Response (200 OK):**
```json
{
  "events": [
    {
      "id": "event_abc123",
      "title": "Meeting with John Doe",
      "description": "Discuss Q2 requirements",
      "startTime": "2024-01-16T14:00:00Z",
      "endTime": "2024-01-16T15:00:00Z",
      "location": "Google Meet",
      "meetLink": "https://meet.google.com/abc-defg-hij",
      "attendees": ["john@customer.com", "agent@demo.com"],
      "linkedCustomer": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe"
      }
    }
  ]
}
```

---

### POST /integrations/calendar/events

Create calendar event.

**Request:**
```json
{
  "title": "Follow-up Call",
  "description": "Discuss proposal",
  "startTime": "2024-01-17T10:00:00Z",
  "endTime": "2024-01-17T10:30:00Z",
  "attendees": ["john@customer.com"],
  "customerId": "880e8400-e29b-41d4-a716-446655440000",
  "addMeetLink": true
}
```

**Response (201 Created):**
```json
{
  "id": "event_xyz789",
  "title": "Follow-up Call",
  "meetLink": "https://meet.google.com/xyz-abcd-efg",
  "calendarLink": "https://calendar.google.com/event?eid=..."
}
```

---

### POST /integrations/clickup/tasks

Create ClickUp task from CRM.

**Request:**
```json
{
  "name": "Follow up with John Doe",
  "description": "Regarding enterprise proposal discussion",
  "customerId": "880e8400-e29b-41d4-a716-446655440000",
  "interactionId": "990e8400-e29b-41d4-a716-446655440000",
  "dueDate": "2024-01-20",
  "priority": 2
}
```

**Response (201 Created):**
```json
{
  "taskId": "task_8cvz3",
  "name": "Follow up with John Doe",
  "url": "https://app.clickup.com/t/8cvz3",
  "status": "to do",
  "linkedCustomerId": "880e8400-e29b-41d4-a716-446655440000"
}
```

---

### POST /integrations/zego/token

Generate ZegoCloud token for call.

**Request:**
```json
{
  "roomId": "room_neobit_dd0e8400",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "userName": "Agent User",
  "expiresIn": 3600
}
```

**Response (200 OK):**
```json
{
  "token": "04AAAAAGVj...",
  "appID": 1934093598,
  "serverWSS": "wss://webliveroom1934093598-api.coolzcloud.com/ws",
  "serverWSSBackup": "wss://webliveroom1934093598-api-bak.coolzcloud.com/ws",
  "expiresAt": "2024-01-15T13:00:00Z"
}
```

---

### POST /integrations/telegram/link

Link Telegram chat to customer.

**Request:**
```json
{
  "chatId": 123456789,
  "customerId": "880e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "linkedChatId": 123456789,
  "customer": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe"
  },
  "message": "Telegram chat linked to customer"
}
```

---

## 7. Search Endpoints

### GET /search

Full-text search across CRM data.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| q | string | Search query |
| type | string[] | Filter by type (customer, interaction) |
| page | int | Page number |
| size | int | Results per page |

**Example:**
```
GET /search?q=enterprise%20proposal&type=customer,interaction&size=10
```

**Response (200 OK):**
```json
{
  "query": "enterprise proposal",
  "totalResults": 15,
  "results": [
    {
      "type": "customer",
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "score": 0.95,
      "highlights": {
        "name": "<em>Enterprise</em> Corp",
        "company": "<em>Enterprise</em> Solutions"
      },
      "data": {
        "name": "Enterprise Corp",
        "email": "contact@enterprise.com"
      }
    },
    {
      "type": "interaction",
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "score": 0.87,
      "highlights": {
        "content": "Discussed <em>enterprise</em> <em>proposal</em> pricing..."
      },
      "data": {
        "type": "NOTE",
        "subject": "Meeting Notes",
        "customerId": "880e8400-e29b-41d4-a716-446655440000"
      }
    }
  ],
  "facets": {
    "type": {
      "customer": 5,
      "interaction": 10
    }
  }
}
```

---

### POST /search/advanced

Advanced search with filters.

**Request:**
```json
{
  "query": "proposal",
  "filters": {
    "type": ["interaction"],
    "interactionType": ["EMAIL", "NOTE"],
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "tags": ["enterprise"]
  },
  "sort": {
    "field": "createdAt",
    "order": "desc"
  }
}
```

**Response (200 OK):**
```json
{
  "query": "proposal",
  "filters": {...},
  "totalResults": 8,
  "results": [...]
}
```

---

## 8. Reports Endpoints

### GET /reports/dashboard

Get dashboard statistics.

**Response (200 OK):**
```json
{
  "period": "2024-01-01 to 2024-01-15",
  "customers": {
    "total": 150,
    "new": 12,
    "changePercent": 8.5
  },
  "interactions": {
    "total": 523,
    "byType": {
      "EMAIL": 245,
      "CALL": 89,
      "CHAT": 156,
      "NOTE": 33
    },
    "byChannel": {
      "GMAIL": 245,
      "TELEGRAM": 156,
      "ZEGO": 89,
      "MANUAL": 33
    }
  },
  "responseTime": {
    "average": "2h 15m",
    "median": "1h 45m"
  },
  "topAgents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Agent User",
      "interactions": 156,
      "avgResponseTime": "1h 30m"
    }
  ]
}
```

---

### GET /reports/interactions

Get interaction analytics.

**Query Parameters:**
| Name | Type | Description |
|------|------|-------------|
| startDate | date | Start of date range |
| endDate | date | End of date range |
| groupBy | string | day, week, month |

**Response (200 OK):**
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "groupBy": "week",
  "data": [
    {
      "period": "2024-W01",
      "total": 125,
      "byType": {
        "EMAIL": 60,
        "CALL": 25,
        "CHAT": 35,
        "NOTE": 5
      }
    },
    {
      "period": "2024-W02",
      "total": 145,
      "byType": {
        "EMAIL": 70,
        "CALL": 30,
        "CHAT": 40,
        "NOTE": 5
      }
    }
  ]
}
```

---

### GET /reports/customers

Get customer analytics.

**Response (200 OK):**
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "acquisition": {
    "total": 25,
    "bySource": {
      "website": 10,
      "referral": 8,
      "social": 5,
      "other": 2
    }
  },
  "engagement": {
    "active": 120,
    "inactive": 30,
    "averageInteractions": 3.5
  },
  "topCustomers": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "interactions": 25,
      "lastActivity": "2024-01-14T15:30:00Z"
    }
  ]
}
```

---

### POST /reports/export

Export report to file.

**Request:**
```json
{
  "reportType": "interactions",
  "format": "csv",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "filters": {
    "type": ["EMAIL", "CALL"]
  },
  "fields": ["date", "customer", "type", "subject", "agent"]
}
```

**Response (202 Accepted):**
```json
{
  "exportId": "export_ff0e8400",
  "status": "PROCESSING",
  "message": "Export started. Download will be available shortly.",
  "checkStatusUrl": "/reports/export/export_ff0e8400"
}
```

---

### GET /reports/export/{exportId}

Get export status and download.

**Response (200 OK - Complete):**
```json
{
  "exportId": "export_ff0e8400",
  "status": "COMPLETED",
  "downloadUrl": "https://storage.neobit.com/exports/interactions_2024-01.csv",
  "expiresAt": "2024-01-16T12:00:00Z",
  "fileSize": 245000,
  "rowCount": 500
}
```

---

## 9. AI Assistant Endpoints (Phase 2)

### POST /ai/query

Query AI assistant about CRM data.

**Request:**
```json
{
  "query": "What are the key issues John Doe mentioned in our last calls?",
  "context": {
    "customerId": "880e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response (200 OK):**
```json
{
  "queryId": "query_abc123",
  "response": "Based on the last 3 calls with John Doe:\n\n1. **Integration Issues** (Jan 10): Mentioned difficulties connecting the API...\n2. **Pricing Concerns** (Jan 12): Asked about volume discounts...\n3. **Timeline** (Jan 14): Needs implementation by end of Q1...",
  "sources": [
    {
      "type": "interaction",
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "date": "2024-01-14"
    }
  ],
  "suggestedActions": [
    {
      "action": "SCHEDULE_FOLLOWUP",
      "description": "Schedule call to discuss pricing options"
    }
  ]
}
```

---

### POST /ai/summarize

Summarize customer interactions.

**Request:**
```json
{
  "customerId": "880e8400-e29b-41d4-a716-446655440000",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-15"
  }
}
```

**Response (200 OK):**
```json
{
  "customerId": "880e8400-e29b-41d4-a716-446655440000",
  "customerName": "John Doe",
  "period": "2024-01-01 to 2024-01-15",
  "summary": {
    "overview": "John Doe is evaluating our enterprise plan for Q2 implementation...",
    "keyTopics": [
      "Enterprise pricing",
      "API integration",
      "Implementation timeline"
    ],
    "sentiment": "POSITIVE",
    "urgency": "MEDIUM",
    "nextSteps": [
      "Send revised proposal by Jan 18",
      "Schedule technical demo",
      "Introduce to implementation team"
    ]
  },
  "interactionCount": 8
}
```

---

### POST /ai/transcribe

Transcribe audio/video recording.

**Request (multipart/form-data):**
```
file: meeting_recording.mp3
language: en
```

**Response (202 Accepted):**
```json
{
  "transcriptionId": "trans_xyz789",
  "status": "PROCESSING",
  "estimatedTime": 120,
  "checkStatusUrl": "/ai/transcribe/trans_xyz789"
}
```

---

### GET /ai/transcribe/{transcriptionId}

Get transcription status and result.

**Response (200 OK - Complete):**
```json
{
  "transcriptionId": "trans_xyz789",
  "status": "COMPLETED",
  "duration": 1245,
  "language": "en",
  "transcription": {
    "text": "Agent: Hello, thank you for joining the call today...",
    "segments": [
      {
        "speaker": "Agent",
        "start": 0.0,
        "end": 5.2,
        "text": "Hello, thank you for joining the call today."
      },
      {
        "speaker": "Customer",
        "start": 5.5,
        "end": 12.3,
        "text": "Thanks for having me. I wanted to discuss..."
      }
    ]
  },
  "summary": "Meeting covered pricing discussion, API capabilities, and implementation timeline..."
}
```

---

## 10. Webhook Endpoints

### POST /webhooks/telegram/{tenantId}

Telegram webhook endpoint (called by Telegram servers).

**Request (from Telegram):**
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 123,
    "from": {
      "id": 987654321,
      "first_name": "John",
      "last_name": "Doe"
    },
    "chat": {
      "id": 987654321,
      "type": "private"
    },
    "date": 1705320600,
    "text": "Hi, I need help with my order"
  }
}
```

**Response (200 OK):**
```json
{
  "method": "sendMessage",
  "chat_id": 987654321,
  "text": "Thank you for your message! An agent will respond shortly."
}
```

---

### POST /webhooks/zego

ZegoCloud callback webhook.

**Request (from ZegoCloud):**
```json
{
  "event": "room_close",
  "room_id": "room_neobit_dd0e8400",
  "timestamp": 1705320600,
  "data": {
    "duration": 1245,
    "participants": ["user_1", "user_2"]
  },
  "signature": "abc123..."
}
```

**Response (200 OK):**
```json
{
  "status": "received"
}
```

---

### POST /webhooks/clickup

ClickUp webhook for task updates.

**Request (from ClickUp):**
```json
{
  "event": "taskStatusUpdated",
  "task_id": "task_8cvz3",
  "history_items": [
    {
      "field": "status",
      "before": {
        "status": "to do"
      },
      "after": {
        "status": "complete"
      }
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "status": "processed"
}
```

---

## Rate Limiting

| Endpoint Category | Rate Limit |
|-------------------|------------|
| Authentication | 10 req/min per IP |
| API (authenticated) | 100 req/min per user |
| Search | 30 req/min per user |
| Export | 5 req/hour per tenant |
| AI | 20 req/min per tenant |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320660
```

---

## Pagination

All list endpoints support cursor-based or offset pagination:

**Offset Pagination:**
```
GET /customers?page=2&size=20
```

**Response includes:**
```json
{
  "content": [...],
  "page": 2,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8,
  "first": false,
  "last": false
}
```

---

## Filtering & Sorting

**Filtering:**
```
GET /customers?tags=vip,enterprise&status=active
```

**Sorting:**
```
GET /customers?sort=name,asc&sort=createdAt,desc
```

**Date Ranges:**
```
GET /interactions?startDate=2024-01-01&endDate=2024-01-31
```

---

## WebSocket Events

Connect to: `wss://api.neobit.com/ws`

**Authentication:**
```json
{
  "type": "auth",
  "token": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
```

**Event Types:**
```json
// New interaction received
{
  "type": "interaction.created",
  "data": {
    "id": "990e8400...",
    "type": "CHAT",
    "customerId": "880e8400..."
  }
}

// Customer updated
{
  "type": "customer.updated",
  "data": {
    "id": "880e8400...",
    "changes": ["tags", "assignedTo"]
  }
}

// Call incoming
{
  "type": "call.incoming",
  "data": {
    "roomId": "room_neobit_...",
    "customerId": "880e8400...",
    "customerName": "John Doe"
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```javascript
import { NeoBitClient } from '@neobit/sdk';

const client = new NeoBitClient({
  baseUrl: 'https://api.neobit.com/api',
  accessToken: 'your-access-token'
});

// Get customers
const customers = await client.customers.list({ page: 0, size: 20 });

// Create interaction
const interaction = await client.interactions.create({
  customerId: '880e8400...',
  type: 'NOTE',
  content: 'Meeting notes...'
});
```

### cURL Examples

```bash
# Login
curl -X POST https://api.neobit.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get customers with auth
curl https://api.neobit.com/api/customers \
  -H "Authorization: Bearer <token>"

# Create customer
curl -X POST https://api.neobit.com/api/customers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Customer","email":"new@customer.com"}'
```

---

**API Version:** v1 | **Last Updated:** 2024-01-15

