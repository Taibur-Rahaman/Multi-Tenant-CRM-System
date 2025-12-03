# NeoBit Multi-Tenant CRM System

> **⚠️ SECURITY NOTICE**: This repository contains sensitive API credentials in `.env.example`. Before deploying to production:
> 1. **Rotate ALL secrets** immediately after initial setup
> 2. Never commit `.env` files to version control
> 3. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) in production
> 4. Implement secret rotation policies (90-day maximum)
> 5. Enable audit logging for credential access

---

## Project Metadata

| Field | Value |
|-------|-------|
| **Project** | NeoBit Multi-Tenant CRM System |
| **Team** | NeoBit |
| **Prepared by** | Md Taibur Rahaman (1931424642), Md Nazim Uddin (1931478042), Mahin Sarker Bushra (2031636642), Samita Zahin Chowdhury (191190042) |
| **Supervisor** | Dr. Nabeel Mohammed |
| **Version** | 2.0 (Phase 1 + Phase 2) |

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Multi-Tenancy Strategy](#multi-tenancy-strategy)
5. [Quick Start](#quick-start)
6. [Development Setup](#development-setup)
7. [Deployment](#deployment)
8. [API Documentation](#api-documentation)
9. [Security](#security)
10. [Testing](#testing)

---

## Overview

NeoBit CRM is a **multi-tenant SaaS platform** designed to help vendors manage customer relationships, interactions, and communications across multiple channels. The system provides:

### Phase 1 Features
- 🔐 **OAuth2 Authentication** - Google & GitHub social login with JWT
- 👥 **Multi-Tenant Architecture** - Strict data isolation per vendor
- 📧 **Email Integration** - Gmail OAuth2 for email tracking
- 📅 **Calendar Sync** - Google Calendar integration
- 🤖 **Telegram Bot** - Customer messaging via Telegram
- 📞 **Voice/Video Calls** - ZegoCloud WebRTC integration
- 📋 **Task Management** - ClickUp integration for tickets
- 📊 **Customer Management** - Full CRM capabilities
- 📱 **Mobile App** - Android native application

### Phase 2 Features
- 🧠 **AI Assistant** - Conversational AI for customer support
- 🎙️ **Voice Processing** - STT/TTS for call transcription
- 📝 **Meeting Summarization** - AI-powered meeting notes
- 🔍 **Advanced Search** - Full-text search with Elasticsearch
- 📈 **Reporting & Analytics** - Custom reports with CSV export

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system architecture diagrams.

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (Nginx)                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│  React SPA    │        │  Spring Boot  │        │  Telegram Bot │
│  (Frontend)   │        │  (Backend)    │        │  (Worker)     │
└───────────────┘        └───────────────┘        └───────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│  PostgreSQL   │        │    Redis      │        │ Elasticsearch │
│  (Database)   │        │   (Cache)     │        │   (Search)    │
└───────────────┘        └───────────────┘        └───────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TailwindCSS, React Router, Zustand |
| **Backend** | Spring Boot 3.2, Java 17, Spring Security, JPA/Hibernate |
| **Database** | PostgreSQL 15 with row-level security |
| **Cache** | Redis 7 |
| **Search** | Elasticsearch 8 (Phase 2) |
| **Mobile** | Android (Java), Retrofit, OkHttp |
| **Voice/Video** | ZegoCloud WebRTC SDK |
| **Bot** | Python (python-telegram-bot) or Java |
| **CI/CD** | GitHub Actions, Docker, Docker Compose |
| **Monitoring** | Prometheus, Grafana (optional) |

---

## Multi-Tenancy Strategy

We implement **Row-Level Isolation with Tenant ID** for the following reasons:

### Why Row-Level Over Schema-Per-Tenant?

| Factor | Row-Level | Schema-Per-Tenant |
|--------|-----------|-------------------|
| Scalability | ✅ Better for 100+ tenants | ❌ Schema explosion |
| Simplicity | ✅ Single schema, easier migrations | ❌ Complex migration scripts |
| Cost | ✅ Shared resources | ❌ Higher resource usage |
| Isolation | ⚠️ Application-enforced | ✅ Database-enforced |

### Implementation

1. **Tenant ID Column**: Every table includes `tenant_id` foreign key
2. **Hibernate Filter**: Automatic tenant filtering on all queries
3. **Spring Security**: Tenant context from JWT token
4. **PostgreSQL RLS**: Additional database-level enforcement (optional)

### Migration Steps

```sql
-- Step 1: Add tenant_id to existing tables
ALTER TABLE customers ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE interactions ADD COLUMN tenant_id UUID NOT NULL;

-- Step 2: Create indexes for performance
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_interactions_tenant ON interactions(tenant_id);

-- Step 3: Enable Row-Level Security (optional but recommended)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON customers
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## Quick Start

### Prerequisites

- Docker & Docker Compose v2.20+
- Node.js 18+ (for local frontend dev)
- Java 17+ (for local backend dev)
- Android Studio (for mobile dev)

### 1. Clone and Configure

```bash
git clone https://github.com/neobit-team/neobit-crm.git
cd neobit-crm

# Copy environment file
cp .env.example .env

# Edit .env with your configuration (credentials pre-filled)
```

### 2. Start All Services

```bash
# Start entire stack
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 3. Access Applications

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api |
| API Docs (Swagger) | http://localhost:8080/swagger-ui.html |
| Telegram Webhook | http://localhost:8081/webhook |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### 4. Default Admin Credentials

```
Platform Admin:
  Email: admin@neobit.com
  Password: Admin@123!

Demo Vendor:
  Email: vendor@demo.com
  Password: Vendor@123!
```

---

## Development Setup

### Backend (Spring Boot)

```bash
cd backend

# Install dependencies
./mvnw clean install -DskipTests

# Run with dev profile
./mvnw spring-boot:run -Dspring.profiles.active=dev

# Run tests
./mvnw test
```

### Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Mobile (Android)

```bash
# Open in Android Studio
cd mobile/android

# Build debug APK
./gradlew assembleDebug

# Run tests
./gradlew test
```

### Telegram Bot

```bash
cd telegram-bot

# Python version
pip install -r requirements.txt
python bot.py

# Or Java version
./mvnw spring-boot:run
```

---

## Deployment

### Docker Compose (Recommended for Dev/Staging)

```bash
# Production build and deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Scale backend instances
docker-compose up -d --scale backend=3
```

### Kubernetes (Production)

```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n neobit
```

---

## API Documentation

Full API documentation available at:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs
- **Markdown**: [API_DOC.md](./API_DOC.md)

### Quick Examples

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor@demo.com","password":"Vendor@123!"}'

# Get Customers (with JWT)
curl http://localhost:8080/api/customers \
  -H "Authorization: Bearer <token>"
```

---

## Security

### Authentication Flow

1. **Social Login**: Google/GitHub OAuth2 → Backend validates → Issues JWT
2. **JWT Tokens**: Access token (15 min) + Refresh token (7 days)
3. **Token Refresh**: Silent refresh before expiry
4. **Revocation**: Logout invalidates refresh token in Redis

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| `PLATFORM_ADMIN` | Full system access, manage tenants |
| `VENDOR_ADMIN` | Manage own tenant, users, settings |
| `AGENT` | Access assigned customers, log interactions |

### Secret Rotation

```bash
# Rotate OAuth secrets (example)
1. Generate new secret in provider console
2. Update .env with new secret
3. Restart services: docker-compose restart backend
4. Revoke old secret in provider console
```

---

## Testing

See [TEST_PLAN.md](./TEST_PLAN.md) for comprehensive testing strategy.

```bash
# Run all tests
./mvnw test                    # Backend unit tests
npm test                       # Frontend unit tests
npm run test:e2e              # E2E with Cypress

# Generate coverage report
./mvnw jacoco:report
```

---

## Project Structure

```
neobit-crm/
├── backend/                    # Spring Boot application
│   ├── src/main/java/
│   │   └── com/neobit/crm/
│   │       ├── config/        # Security, OAuth, multitenancy
│   │       ├── controller/    # REST controllers
│   │       ├── service/       # Business logic
│   │       ├── repository/    # Data access
│   │       ├── model/         # Entity classes
│   │       └── dto/           # Data transfer objects
│   └── src/test/
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── store/             # Zustand state
│   │   └── api/               # API client
│   └── tests/
├── mobile/                     # Android application
│   └── android/
│       └── app/src/main/java/
├── telegram-bot/               # Telegram bot service
├── docker/                     # Docker configurations
├── k8s/                        # Kubernetes manifests
├── .github/workflows/          # CI/CD pipelines
└── docs/                       # Additional documentation
```

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## License

This project is developed for academic purposes as part of the coursework supervised by Dr. Nabeel Mohammed.

---

## Support

For issues and questions:
- Create a GitHub Issue
- Contact team at: neobit-team@example.com

---

**Built with ❤️ by Team NeoBit**

