# Multi-Tenant CRM System

A comprehensive, AI-powered Customer Relationship Management system with multi-tenant architecture, voice capabilities, and seamless integrations.

## 🚀 Features

### Phase 1 – Core Platform
- [x] **Multi-Tenant Architecture**: Vendor isolation with shared database
- [x] **Authentication**: OAuth2 + JWT with role-based access (Admin, Agent)
- [x] **CRM Core Modules**: Customers, Accounts, Interactions, Tasks
- [x] **Search & Reporting**: Full-text search with filters
- [x] **Integrations**: Gmail, Calendar, Telegram, Jira/Linear, Telephony
- [x] **React Web App**: Modern, responsive dashboard
- [x] **Docker Deployment**: Complete containerization

### Phase 2 – AI & Automation
- [x] **AI Assistant**: Conversational Q&A about CRM data
- [x] **Summarization**: Email, meeting, and interaction summaries
- [x] **Voice System**: Speech-to-text and text-to-speech
- [x] **Automation Engine**: Auto-lead creation, complaint detection
- [x] **Lead Scoring**: AI-powered lead prioritization
- [x] **Meeting Preparation**: AI-generated briefing notes

## 📁 Project Structure

```
Multi-Tenant-CRM-System/
├── backend/                 # Spring Boot Backend
│   ├── src/
│   │   └── main/
│   │       ├── java/com/neobit/crm/
│   │       │   ├── controller/      # REST Controllers
│   │       │   ├── service/         # Business Logic
│   │       │   ├── repository/      # Data Access
│   │       │   ├── entity/          # JPA Entities
│   │       │   ├── dto/             # Data Transfer Objects
│   │       │   ├── security/        # JWT & Auth
│   │       │   └── config/          # Configuration
│   │       └── resources/
│   │           ├── db/migration/    # Flyway Migrations
│   │           └── application.yml
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── components/      # Reusable Components
│   │   ├── pages/           # Page Components
│   │   ├── services/        # API Services
│   │   ├── store/           # Zustand State
│   │   └── types/           # TypeScript Types
│   ├── Dockerfile
│   └── package.json
│
├── ai-service/              # Python FastAPI AI Service
│   ├── app/
│   │   ├── routers/         # API Routes
│   │   ├── services/        # Business Logic
│   │   └── middleware/      # Auth & Tenant
│   ├── Dockerfile
│   └── requirements.txt
│
├── android/                 # Android App (Kotlin)
│
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── postman/
│
├── docker-compose.yml       # Full Stack Deployment
├── .github/workflows/       # CI/CD Pipeline
└── .env.example             # Environment Variables
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Zustand |
| **Backend** | Spring Boot 3.2, Spring Security, JPA |
| **AI Service** | FastAPI, OpenAI GPT-4, Whisper |
| **Database** | PostgreSQL 16, ElasticSearch 8.x, Redis |
| **Deployment** | Docker, Docker Compose, GitHub Actions |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Java 21+ (for local development)
- Python 3.11+ (for AI service development)

### 1. Clone & Configure

```bash
git clone https://github.com/your-repo/Multi-Tenant-CRM-System.git
cd Multi-Tenant-CRM-System

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:8080/api |
| AI Service | http://localhost:8001 |
| API Docs | http://localhost:8080/api/swagger-ui.html |

### 4. Default Credentials

```
Email: admin@demo.com
Password: admin123
Tenant: demo
```

## 🔧 Development Setup

### Backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### AI Service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## 📚 API Documentation

- **Swagger UI**: http://localhost:8080/api/swagger-ui.html
- **API Docs**: See [docs/API.md](docs/API.md)
- **Postman Collection**: [docs/postman/](docs/postman/)

## 🏗️ Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system architecture.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Database   │
│   (React)   │     │ (Spring)    │     │ (PostgreSQL)│
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ AI Service  │
                    │  (FastAPI)  │
                    └─────────────┘
```

## 🧪 Testing

```bash
# Backend tests
cd backend && ./mvnw test

# Frontend tests
cd frontend && npm test

# AI Service tests
cd ai-service && pytest

# E2E tests
cd frontend && npx cypress run
```

## 📦 Deployment

### Docker Compose (Production)

```bash
docker-compose -f docker-compose.yml up -d
```

### CI/CD

GitHub Actions pipeline automatically:
1. Runs tests for all services
2. Builds Docker images
3. Pushes to container registry
4. (Optional) Deploys to production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

| Member | Role |
|--------|------|
| Taibur | Team Lead |
| Nazim | Backend Lead |
| Bushra | Frontend |
| Samita | Android |

---

Built with ❤️ for modern CRM needs
