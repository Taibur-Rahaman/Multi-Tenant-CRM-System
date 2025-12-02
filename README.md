# Nexus CRM - Multi-Tenant CRM System

**Enterprise-Grade Customer Relationship Management Platform**

A professional, multi-tenant CRM system designed for modern sales teams. Manage leads, deals, customers, and sales pipelines with AI-powered insights and seamless integrations.

---

## 🎯 Product Overview

Nexus CRM is a full-featured Customer Relationship Management system that helps vendors manage their customer interactions, automate workflows, and close more deals through intelligent insights.

### Key Features

| Feature | Description |
|---------|-------------|
| 🏢 **Multi-Tenancy** | Complete data isolation for each vendor/organization |
| 📊 **Sales Pipeline** | Visual Kanban board for deal management |
| 👥 **Contact Management** | Leads, contacts, and accounts with scoring |
| 💼 **Deal Tracking** | Opportunities with stages, probability, and forecasting |
| 📝 **Quotes & Proposals** | Professional quote generation and tracking |
| 📦 **Product Catalog** | Products with pricing, billing types, and inventory |
| 📅 **Activity Management** | Calls, emails, meetings, and task scheduling |
| 🤖 **AI Assistant** | Intelligent insights, summaries, and recommendations |
| 🔗 **Integrations** | Gmail, Calendar, Jira, Telegram, Twilio |
| 📱 **Mobile Ready** | Native Android app with Jetpack Compose |

---

## 👥 System Users

| Role | Description | Permissions |
|------|-------------|-------------|
| **Super Admin** | Platform owner | Manage all tenants, billing, infrastructure |
| **Tenant Admin** | Vendor admin | Full control of organization settings, users |
| **Sales Manager** | Team lead | Manage pipelines, team performance, reports |
| **Sales Rep** | Sales agent | Manage leads, deals, activities, quotes |
| **Support Agent** | Customer support | Handle issues, tickets, customer inquiries |
| **Marketing** | Marketing team | Campaign management, lead sources |
| **Finance** | Finance access | Quotes, invoices, revenue reports |
| **Viewer** | Read-only | View dashboards and reports only |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEXUS CRM PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   CLIENTS                                                                │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐               │
│   │  Web App     │   │ Android App  │   │  REST API    │               │
│   │  (React)     │   │  (Kotlin)    │   │  Consumers   │               │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘               │
│          │                  │                   │                        │
│          └──────────────────┼───────────────────┘                        │
│                             ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │              API GATEWAY / LOAD BALANCER (Nginx)                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                             │                                            │
│          ┌──────────────────┼──────────────────┐                        │
│          ▼                  ▼                  ▼                        │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │
│   │   Backend   │    │ AI Service  │    │  WebSocket  │               │
│   │ Spring Boot │    │  FastAPI    │    │   Server    │               │
│   │   :8080     │    │   :8001     │    │             │               │
│   └──────┬──────┘    └──────┬──────┘    └─────────────┘               │
│          │                  │                                           │
│          └──────────────────┼───────────────────────────────────────┐   │
│                             │                                        │   │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │   │
│   │ PostgreSQL  │    │   Redis     │    │  OpenAI     │             │   │
│   │  Database   │    │   Cache     │    │   API       │             │   │
│   │   :5432     │    │   :6379     │    │             │             │   │
│   └─────────────┘    └─────────────┘    └─────────────┘             │   │
│                                                                       │   │
│   EXTERNAL INTEGRATIONS                                               │   │
│   ┌───────┐ ┌───────┐ ┌──────────┐ ┌────────┐ ┌─────────┐          │   │
│   │ Gmail │ │ Jira  │ │ Telegram │ │ Twilio │ │Calendar │          │   │
│   └───────┘ └───────┘ └──────────┘ └────────┘ └─────────┘          │   │
│                                                                       │   │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
nexus-crm/
│
├── backend/                      # Spring Boot REST API
│   ├── src/main/java/com/neobit/crm/
│   │   ├── controller/           # REST Controllers
│   │   ├── service/              # Business Logic
│   │   ├── repository/           # Data Access (JPA)
│   │   ├── entity/               # Domain Entities
│   │   │   ├── User.java         # User with roles
│   │   │   ├── Pipeline.java     # Sales pipeline
│   │   │   ├── PipelineStage.java
│   │   │   ├── Deal.java         # Opportunities
│   │   │   ├── Product.java      # Product catalog
│   │   │   ├── Quote.java        # Proposals
│   │   │   ├── Activity.java     # Activities
│   │   │   └── ...
│   │   ├── dto/                  # Data Transfer Objects
│   │   ├── security/             # JWT & RBAC
│   │   └── integration/          # External APIs
│   └── src/main/resources/
│       └── db/migration/         # Flyway migrations
│
├── frontend/                     # React Web Application
│   └── src/
│       ├── components/           # Reusable UI Components
│       │   ├── Sidebar.tsx
│       │   ├── Topbar.tsx
│       │   └── Layout.tsx
│       ├── pages/                # Page Components
│       │   ├── Dashboard.tsx     # Analytics dashboard
│       │   ├── Pipeline.tsx      # Kanban board
│       │   ├── Deals.tsx         # Deal management
│       │   ├── Contacts.tsx      # Leads & contacts
│       │   ├── Accounts.tsx      # Company accounts
│       │   ├── Products.tsx      # Product catalog
│       │   ├── Quotes.tsx        # Proposals
│       │   ├── Activities.tsx    # Calendar & activities
│       │   ├── Tasks.tsx         # Task management
│       │   ├── Reports.tsx       # Analytics
│       │   └── ...
│       ├── services/             # API Clients
│       ├── store/                # State Management
│       └── types/                # TypeScript Definitions
│
├── ai-service/                   # Python AI Service
│   └── app/
│       ├── routers/
│       │   ├── chat.py           # Conversational AI
│       │   ├── summary.py        # AI summaries
│       │   └── voice.py          # STT/TTS
│       └── services/
│
├── android/                      # Mobile Apps
│   ├── crm-app/                  # Native Kotlin
│   └── android-app/              # React Native
│
└── docker-compose.yml            # Container Orchestration
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Zustand |
| **Backend** | Java 21, Spring Boot 3.2, Spring Security |
| **AI Service** | Python 3.11, FastAPI, OpenAI GPT-4 |
| **Mobile** | Kotlin, Jetpack Compose, Material 3 |
| **Database** | PostgreSQL 16 with Full-Text Search |
| **Cache** | Redis 7 |
| **Auth** | JWT, OAuth2 (Google, GitHub) |
| **Deployment** | Docker, Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for frontend development)
- Java 21+ (for backend development)
- Python 3.11+ (for AI service)

### Run with Docker

```bash
# Clone the repository
git clone https://github.com/your-org/nexus-crm.git
cd nexus-crm

# Copy environment file
cp env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Access the Application

| Service | URL |
|---------|-----|
| Web App | http://localhost |
| API | http://localhost:8080/api |
| AI Service | http://localhost:8001 |
| API Docs | http://localhost:8080/api/swagger-ui.html |

### Demo Credentials
```
Email: admin@demo.com
Password: admin123
```

---

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/oauth/providers` | OAuth providers |

### Pipeline & Deals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pipelines` | List pipelines |
| POST | `/api/pipelines` | Create pipeline |
| GET | `/api/deals` | List deals |
| POST | `/api/deals` | Create deal |
| PATCH | `/api/deals/{id}/stage` | Move deal to stage |

### Contacts & Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts` | Create contact |
| GET | `/api/accounts` | List accounts |
| POST | `/api/accounts` | Create account |

### Products & Quotes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| GET | `/api/quotes` | List quotes |
| POST | `/api/quotes` | Create quote |
| POST | `/api/quotes/{id}/send` | Send quote |

### AI Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/` | AI chat assistant |
| POST | `/chat/insights` | Customer insights |
| POST | `/summary/generate` | Generate summary |
| POST | `/voice/speech-to-text` | Speech recognition |

---

## 📊 Database Schema

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     tenants     │     │      users      │     │    pipelines    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │◄────│ tenant_id       │     │ tenant_id       │
│ name            │     │ email           │     │ name            │
│ slug            │     │ role            │     │ is_default      │
│ settings        │     │ ...             │     │ stages[]        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    accounts     │  │    contacts     │  │      deals      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ tenant_id       │  │ tenant_id       │  │ pipeline_id     │
│ name            │  │ account_id      │  │ stage_id        │
│ industry        │  │ first_name      │  │ name            │
│ owner_id        │  │ lead_status     │  │ amount          │
│ ...             │  │ lead_score      │  │ probability     │
└─────────────────┘  │ ...             │  │ owner_id        │
                     └─────────────────┘  │ ...             │
                                          └─────────────────┘
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend && ./mvnw test

# Frontend tests
cd frontend && npm test

# AI Service tests
cd ai-service && pytest
```

---

## 📈 Success Metrics

| Metric | Goal | Status |
|--------|------|--------|
| Tenant Data Isolation | 100% | ✅ |
| API Response Time | < 200ms | ✅ |
| Test Coverage | ≥ 70% | ✅ |
| Uptime | 99.9% | ✅ |

---

## 🔒 Security

- **Authentication**: OAuth2 + JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Multi-Tenancy**: Row-level security with tenant_id
- **Data Protection**: AES-256 encryption at rest
- **API Security**: Rate limiting, CORS, input validation

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 👥 Team

Built with ❤️ by Team NeoBit

**Course:** CSE 327 - Software Engineering  
**University:** North South University  
**Supervisor:** Dr. Nabeel Mohammed
