# NeoBit Multi-Tenant CRM System - Architecture Diagrams

This document contains all architecture diagrams for the NeoBit CRM System.

---

## 1. System Architecture Diagram

This diagram shows the high-level system architecture including all services, databases, and external integrations.

```mermaid
flowchart TB
    subgraph "Client Layer"
        WEB[React Web App<br/>Port 3000]
        MOB[Android App]
        TG_USER[Telegram Users]
    end

    subgraph "Load Balancer & Gateway"
        NGINX[Nginx Reverse Proxy<br/>Port 80/443<br/>SSL Termination<br/>Rate Limiting]
    end

    subgraph "Application Services"
        API[Spring Boot API<br/>Port 8080<br/>REST + WebSocket]
        BOT[Telegram Bot Service<br/>Port 8081<br/>Python/Java]
        WORKER[Integration Worker<br/>Background Jobs]
        AI_SVC[AI Service<br/>FastAPI<br/>OpenAI Integration]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL 15<br/>Port 5432<br/>Multi-Tenant DB)]
        REDIS[(Redis 7<br/>Port 6379<br/>Cache + Sessions)]
        ES[(Elasticsearch 8<br/>Port 9200<br/>Full-Text Search)]
    end

    subgraph "External Integrations"
        GOOGLE[Google APIs<br/>OAuth2 + Gmail + Calendar]
        GITHUB[GitHub OAuth2]
        ZEGO[ZegoCloud<br/>WebRTC Voice/Video]
        CLICKUP[ClickUp API<br/>Task Management]
        TG_API[Telegram Bot API]
        OPENAI[OpenAI API<br/>GPT-4 + Whisper]
    end

    %% Client connections
    WEB -->|HTTPS| NGINX
    MOB -->|HTTPS| NGINX
    TG_USER -->|Messages| TG_API

    %% Load balancer routing
    NGINX -->|/api/*| API
    NGINX -->|/| WEB
    NGINX -->|/webhook/*| BOT

    %% Service to data layer
    API -->|JDBC| PG
    API -->|Jedis| REDIS
    API -->|REST| ES
    BOT -->|JDBC| PG
    BOT -->|Jedis| REDIS
    WORKER -->|JDBC| PG
    WORKER -->|Jedis| REDIS
    AI_SVC -->|REST| ES

    %% External API connections
    API -->|OAuth2| GOOGLE
    API -->|OAuth2| GITHUB
    API -->|REST| ZEGO
    API -->|REST| CLICKUP
    API -->|REST| OPENAI
    BOT -->|Webhook| TG_API
    AI_SVC -->|REST| OPENAI

    %% Styling
    classDef client fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef service fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef data fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#e65100,stroke-width:2px

    class WEB,MOB,TG_USER client
    class API,BOT,WORKER,AI_SVC,NGINX service
    class PG,REDIS,ES data
    class GOOGLE,GITHUB,ZEGO,CLICKUP,TG_API,OPENAI external
```

### Architecture Components

**Client Layer:**
- **React Web App**: Modern SPA built with React 18, Vite, TailwindCSS
- **Android App**: Native Android application using Kotlin/Java
- **Telegram Users**: Customers interacting via Telegram bot

**Application Services:**
- **Spring Boot API**: Main REST API with JWT authentication, multi-tenancy support
- **Telegram Bot Service**: Handles Telegram webhooks and message routing
- **Integration Worker**: Background jobs for syncing external data (Gmail, Calendar, ClickUp)
- **AI Service**: FastAPI service for OpenAI integration (GPT-4, Whisper)

**Data Layer:**
- **PostgreSQL**: Primary database with row-level security for multi-tenancy
- **Redis**: Session storage, caching, rate limiting
- **Elasticsearch**: Full-text search and analytics (Phase 2)

**External Integrations:**
- **Google**: OAuth2, Gmail API, Calendar API
- **GitHub**: OAuth2 authentication
- **ZegoCloud**: WebRTC for voice/video calls
- **ClickUp**: Task management integration
- **Telegram**: Bot API for customer messaging
- **OpenAI**: GPT-4 for AI assistant, Whisper for STT

---

## 2. Multi-Tenant Data Model Diagram

This ERD shows the database schema with multi-tenant isolation strategy.

```mermaid
erDiagram
    TENANT ||--o{ USER : "has"
    TENANT ||--o{ CUSTOMER : "has"
    TENANT ||--o{ INTEGRATION_CONFIG : "has"
    TENANT ||--o{ CALENDAR_EVENT : "has"
    TENANT ||--o{ TASK : "has"
    TENANT ||--o{ CALL_SESSION : "has"
    
    USER ||--o{ INTERACTION : "creates"
    USER ||--o{ REFRESH_TOKEN : "has"
    USER ||--o{ CALENDAR_EVENT : "owns"
    
    CUSTOMER ||--o{ INTERACTION : "involves"
    CUSTOMER ||--o{ TASK : "linked_to"
    CUSTOMER ||--o{ CALL_SESSION : "participates"
    CUSTOMER ||--o{ TELEGRAM_CHAT : "linked_to"
    
    INTERACTION ||--o| TASK : "creates"
    INTERACTION ||--o| CALL_SESSION : "linked_to"
    INTERACTION ||--o| TRANSCRIPTION : "has"
    
    TENANT {
        uuid id PK
        string name
        string subdomain UK
        enum plan
        enum status
        jsonb settings
        jsonb limits
        timestamp created_at
    }
    
    USER {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        string email UK
        string name
        string password_hash
        enum role
        enum oauth_provider
        string oauth_id
        boolean is_active
        timestamp created_at
    }
    
    CUSTOMER {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        string name
        string email
        string phone
        string company
        uuid assigned_to FK
        jsonb metadata
        jsonb external_ids
        integer interaction_count
        timestamp last_interaction_at
    }
    
    INTERACTION {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        uuid customer_id FK "NOT NULL"
        uuid user_id FK
        enum type
        enum channel
        enum direction
        string subject
        text content
        jsonb metadata
        text transcription
        text summary
        timestamp created_at
    }
    
    INTEGRATION_CONFIG {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        enum type UK
        enum status
        jsonb credentials "Encrypted"
        string connected_account
        timestamp last_sync_at
    }
    
    TELEGRAM_CHAT {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        uuid customer_id FK
        bigint chat_id UK
        string chat_type
        string username
        boolean is_active
    }
    
    CALENDAR_EVENT {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        uuid user_id FK "NOT NULL"
        uuid customer_id FK
        string google_event_id UK
        string title
        timestamp start_time
        timestamp end_time
    }
    
    TASK {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        uuid customer_id FK
        uuid interaction_id FK
        uuid assigned_to FK
        string clickup_task_id UK
        string name
        string status
        timestamp due_date
    }
    
    CALL_SESSION {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        uuid interaction_id FK
        uuid customer_id FK
        string room_id
        uuid host_user_id FK
        enum call_type
        enum status
        integer duration_seconds
        string recording_url
    }
    
    REFRESH_TOKEN {
        uuid id PK
        uuid user_id FK "NOT NULL"
        string token_hash UK
        timestamp expires_at
        timestamp revoked_at
    }
    
    TRANSCRIPTION {
        uuid id PK
        uuid tenant_id FK "NOT NULL"
        uuid interaction_id FK
        uuid call_session_id FK
        enum status
        text transcription
        jsonb segments
        text summary
    }
```

### Multi-Tenancy Strategy

**Row-Level Isolation:**
- Every table (except `tenants`) includes `tenant_id` as a foreign key
- Hibernate filters automatically append `WHERE tenant_id = :tenantId` to all queries
- PostgreSQL Row-Level Security (RLS) provides additional database-level protection

**Key Design Decisions:**
1. **Shared Schema**: All tenants share the same database schema for easier maintenance
2. **Tenant ID Indexing**: All tenant-scoped tables have indexes on `tenant_id` for performance
3. **Cascade Deletes**: When a tenant is deleted, all associated data is automatically removed
4. **Unique Constraints**: Email uniqueness is scoped per tenant (`UNIQUE(tenant_id, email)`)

---

## 3. Workflow / Sequence Diagram

This diagram shows the complete authentication and customer interaction workflow.

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant N as Nginx
    participant API as Backend API
    participant DB as PostgreSQL
    participant R as Redis
    participant G as Google OAuth
    participant C as Customer
    participant TG as Telegram API

    Note over U,TG: Authentication Flow
    U->>F: Click "Login with Google"
    F->>G: Redirect to OAuth Provider
    G->>U: Show consent screen
    U->>G: Grant permissions
    G->>F: Redirect with auth code
    F->>N: POST /api/auth/oauth/callback
    N->>API: Forward request
    API->>G: Exchange code for tokens
    G->>API: Access token + user info
    API->>DB: Find/Create user by email
    DB->>API: User entity
    API->>DB: Create/Update tenant if needed
    API->>API: Generate JWT access token (15 min)
    API->>API: Generate refresh token (7 days)
    API->>R: Store refresh token
    API->>F: JWT + refresh token
    F->>F: Store tokens in localStorage
    F->>U: Redirect to dashboard

    Note over U,TG: Customer Interaction Flow
    U->>F: View customer list
    F->>N: GET /api/customers (with JWT)
    N->>API: Forward with Authorization header
    API->>API: Validate JWT token
    API->>API: Extract tenant_id from JWT
    API->>API: Set TenantContext
    API->>DB: SELECT * FROM customers<br/>WHERE tenant_id = :tenantId
    DB->>API: Customer list (tenant-filtered)
    API->>F: JSON response
    F->>U: Display customers

    Note over U,TG: Telegram Message Flow
    C->>TG: Send message to bot
    TG->>N: POST /api/webhooks/telegram/{tenantId}
    N->>API: Forward webhook
    API->>API: Validate webhook secret
    API->>DB: Find customer by telegram_chat_id
    DB->>API: Customer entity
    API->>DB: Create interaction record
    API->>R: Publish notification event
    API->>TG: Send auto-reply (if enabled)
    TG->>C: Display reply

    Note over U,TG: Token Refresh Flow
    F->>API: API request with expired token
    API->>F: 401 Unauthorized
    F->>API: POST /api/auth/refresh<br/>(with refresh token)
    API->>R: Validate refresh token
    R->>API: Token valid
    API->>API: Generate new access token
    API->>F: New access token
    F->>API: Retry original request
    API->>F: Success response
```

### Key Workflows Explained

**1. OAuth2 Authentication:**
- User initiates login via Google/GitHub
- Backend exchanges authorization code for access token
- User is created/updated in database with tenant association
- JWT tokens are issued and stored

**2. Multi-Tenant Data Access:**
- Every API request includes JWT with `tenant_id` claim
- Backend extracts tenant ID and sets it in `TenantContext` (ThreadLocal)
- Hibernate filters automatically append tenant filter to all queries
- Database returns only tenant-specific data

**3. Telegram Integration:**
- Telegram sends webhook to backend when customer messages bot
- Backend validates webhook and finds associated customer
- Interaction is logged in database
- Real-time notification sent to frontend via WebSocket

**4. Token Refresh:**
- Access tokens expire after 15 minutes
- Frontend automatically refreshes using refresh token (7 days)
- Refresh tokens are stored in Redis for revocation support

---

## 4. Performance & Security Diagram

This diagram illustrates performance optimizations and security layers.

```mermaid
flowchart TB
    subgraph "Security Layers"
        SSL[SSL/TLS Termination<br/>Nginx]
        RATE[Rate Limiting<br/>Nginx + Redis]
        JWT[JWT Validation<br/>Spring Security Filter]
        TENANT[Tenant Isolation<br/>Hibernate Filter + RLS]
        ENCRYPT[Data Encryption<br/>AES-256 for OAuth tokens]
        RBAC[Role-Based Access Control<br/>PLATFORM_ADMIN, VENDOR_ADMIN, AGENT]
    end

    subgraph "Performance Optimizations"
        CACHE[Redis Cache<br/>- Session storage<br/>- API response cache<br/>- Rate limit counters]
        INDEX[Database Indexes<br/>- tenant_id indexes<br/>- Full-text search indexes<br/>- Composite indexes]
        CONN[Connection Pooling<br/>HikariCP<br/>Max: 20 connections]
        ASYNC[Async Processing<br/>- Email sync workers<br/>- Calendar sync workers<br/>- AI processing]
        CDN[Static Asset CDN<br/>React build assets]
    end

    subgraph "Monitoring & Logging"
        HEALTH[Health Checks<br/>Spring Actuator<br/>/actuator/health]
        AUDIT[Audit Logging<br/>All data modifications<br/>stored in audit_logs]
        METRICS[Application Metrics<br/>- Request latency<br/>- Error rates<br/>- Cache hit rates]
    end

    subgraph "Data Protection"
        BACKUP[Database Backups<br/>Daily automated backups<br/>Point-in-time recovery]
        RLS[Row-Level Security<br/>PostgreSQL RLS policies<br/>Additional tenant isolation]
        ENCRYPT_DB[Encryption at Rest<br/>PostgreSQL TDE<br/>Encrypted volumes]
    end

    SSL --> RATE
    RATE --> JWT
    JWT --> TENANT
    TENANT --> RBAC

    CACHE --> INDEX
    INDEX --> CONN
    CONN --> ASYNC
    ASYNC --> CDN

    HEALTH --> AUDIT
    AUDIT --> METRICS

    BACKUP --> RLS
    RLS --> ENCRYPT_DB

    classDef security fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef performance fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef monitoring fill:#f1f8e9,stroke:#558b2f,stroke-width:2px
    classDef protection fill:#fff3e0,stroke:#ef6c00,stroke-width:2px

    class SSL,RATE,JWT,TENANT,ENCRYPT,RBAC security
    class CACHE,INDEX,CONN,ASYNC,CDN performance
    class HEALTH,AUDIT,METRICS monitoring
    class BACKUP,RLS,ENCRYPT_DB protection
```

### Security Measures

**1. Authentication & Authorization:**
- **OAuth2**: Industry-standard social login (Google, GitHub)
- **JWT Tokens**: Stateless authentication with short-lived access tokens (15 min)
- **Refresh Tokens**: Long-lived tokens (7 days) stored securely in Redis
- **RBAC**: Three-tier role system with granular permissions

**2. Multi-Tenant Isolation:**
- **Application Level**: Hibernate filters automatically filter by `tenant_id`
- **Database Level**: PostgreSQL Row-Level Security (RLS) policies
- **Network Level**: Tenant context extracted from JWT, validated on every request

**3. Data Protection:**
- **Encryption at Rest**: OAuth tokens encrypted with AES-256 before storage
- **Encryption in Transit**: All traffic over HTTPS (TLS 1.3)
- **Audit Logging**: All data modifications logged for compliance

**4. Rate Limiting:**
- **API Rate Limits**: 100 requests/minute per user (configurable)
- **OAuth Rate Limits**: 10 OAuth attempts/hour per IP
- **Redis-backed**: Distributed rate limiting using Redis

### Performance Optimizations

**1. Caching Strategy:**
- **Session Cache**: User sessions in Redis (TTL: 7 days)
- **API Response Cache**: Frequently accessed data cached (TTL: 5 minutes)
- **Database Query Cache**: Hibernate second-level cache for read-heavy operations

**2. Database Optimization:**
- **Indexes**: All `tenant_id` columns indexed for fast filtering
- **Composite Indexes**: `(tenant_id, created_at)` for time-based queries
- **Full-Text Search**: PostgreSQL GIN indexes for customer/interaction search
- **Connection Pooling**: HikariCP with max 20 connections per instance

**3. Async Processing:**
- **Background Workers**: Email/Calendar sync runs asynchronously
- **AI Processing**: Transcription and summarization queued and processed async
- **WebSocket**: Real-time notifications without polling

**4. Scalability:**
- **Horizontal Scaling**: Backend API can be scaled to multiple instances
- **Load Balancing**: Nginx distributes traffic across backend instances
- **Database Read Replicas**: Can be added for read-heavy workloads

---

## Diagram Export Instructions

To export these diagrams as images:

1. **Using Mermaid Live Editor:**
   - Copy diagram code to https://mermaid.live
   - Export as PNG/SVG

2. **Using VS Code:**
   - Install "Markdown Preview Mermaid Support" extension
   - Preview this file and export diagrams

3. **Using CLI:**
   ```bash
   npm install -g @mermaid-js/mermaid-cli
   mmdc -i ARCHITECTURE_DIAGRAMS.md -o diagrams/
   ```

4. **Using GitHub:**
   - Push to GitHub repository
   - GitHub automatically renders Mermaid diagrams in markdown files

5. **Using HTML Viewer:**
   - Open `view-diagrams.html` in your browser
   - All diagrams will render automatically

---

## Additional Resources

- [System Explanation](./SYSTEM_EXPLANATION.md) - Detailed system architecture explanation
- [Video Presentation Guide](./VIDEO_PRESENTATION_GUIDE.md) - Guide for video presentation
- [Main Architecture Documentation](./ARCHITECTURE.md) - Complete architecture documentation
- [API Documentation](./API_DOC.md) - API reference
- [Database Schema](../backend/schema.sql) - SQL schema with comments
- [Deployment Guide](../README.md#deployment) - Step-by-step deployment instructions

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained by**: NeoBit Team
