# Multi-Tenant CRM System

**Course:** CSE 327 - Software Engineering  
**University:** North South University  
**Team:** NeoBit  
**Supervisor:** Dr. Nabeel Mohammed

---

## 👥 Team Members

| Name | ID | Role |
|------|-----|------|
| Md Taibur Rahaman | 1931424642 | Team Lead |
| Md Nazim Uddin | 1931478042 | Backend Lead |
| Mahin Sarker Bushra | 2031636642 | Frontend |
| Samita Zahin Chowdhury | 191190042 | Android |

---

## 📋 Project Overview

A multi-tenant Customer Relationship Management (CRM) system that allows multiple vendors to manage their customers, interactions, and tasks in isolated environments. The system includes AI-powered features for intelligent customer insights and voice-based interactions.

### Product Vision
> "To build a secure, multi-tenant CRM that intelligently manages interactions, automates workflows, and helps vendors build stronger customer relationships through AI-powered insights."

---

## 📁 Project Structure

```
Multi-Tenant-CRM-System/
│
├── backend/                 # Spring Boot REST API (Java)
│   ├── src/main/java/       
│   │   └── com/neobit/crm/
│   │       ├── controller/  # REST Controllers
│   │       ├── service/     # Business Logic
│   │       ├── repository/  # Data Access
│   │       ├── entity/      # JPA Entities
│   │       ├── dto/         # Data Transfer Objects
│   │       ├── security/    # JWT & Auth
│   │       └── integration/ # Gmail, Jira, Telegram, Twilio
│   └── src/test/java/       # Unit Tests
│
├── frontend/                # React Web Application (TypeScript)
│   └── src/
│       ├── components/      # Reusable UI Components
│       ├── pages/           # Page Components
│       ├── services/        # API Calls
│       └── store/           # State Management
│
├── ai-service/              # AI Service (Python FastAPI)
│   └── app/
│       ├── routers/         # Chat, Voice, Summary APIs
│       └── services/        # AI & Voice Processing
│
├── android/                 # Android Mobile App (Kotlin)
│   └── crm-app/             # Jetpack Compose UI
│
├── docs/                    # Documentation
│
└── docker-compose.yml       # Container Orchestration
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 3.2, Spring Security, JPA |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Zustand |
| **AI Service** | Python 3.11, FastAPI, OpenAI, SpeechRecognition |
| **Mobile** | Kotlin, Jetpack Compose, Material 3 |
| **Database** | PostgreSQL 16 (with Full-Text Search) |
| **Cache** | Redis |
| **Auth** | JWT, OAuth2 (Google, GitHub) |
| **Deployment** | Docker, Docker Compose |

---

## ✅ Phase 1: Core Platform (Completed)

### Features Implemented

| Feature | Use Case | Status |
|---------|----------|--------|
| Multi-Tenant Architecture | UC-1 | ✅ |
| User Authentication (OAuth2/JWT) | UC-2 | ✅ |
| Customer Management (CRUD) | UC-3 | ✅ |
| Interaction Logging | UC-4 | ✅ |
| Integration Sync (Gmail, Calendar, Telegram, Jira) | UC-5 | ✅ |
| Direct Call (Twilio) | UC-6 | ✅ |
| Full-Text Search | - | ✅ |
| Web App (React) | - | ✅ |
| Android MVP | - | ✅ |
| Docker Deployment | - | ✅ |
| Unit Tests | - | ✅ |

### API Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/oauth/providers` | Get OAuth providers |

#### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/{id}` | Get customer details |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |
| GET | `/api/customers/search?q=` | Search customers |

#### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| POST | `/api/tasks/{id}/complete` | Mark complete |

#### Interactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interactions` | List interactions |
| POST | `/api/interactions` | Log interaction |
| GET | `/api/interactions/customer/{id}` | Customer interactions |

---

## 🤖 Phase 2: AI Enhancement (Completed)

### Features Implemented

| Feature | Use Case | Status |
|---------|----------|--------|
| Conversational AI Assistant | UC-7 | ✅ |
| Voice Input/Output (STT/TTS) | UC-8 | ✅ |
| Auto Lead Scoring | - | ✅ |
| AI Summarization | - | ✅ |
| Meeting Preparation Brief | - | ✅ |

### AI Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/` | AI chat assistant |
| POST | `/chat/insights` | Customer insights |
| POST | `/chat/meeting-prep` | Meeting preparation |
| POST | `/voice/speech-to-text` | Convert speech to text |
| POST | `/voice/text-to-speech` | Convert text to speech |
| POST | `/voice/voice-command` | Process voice command |
| POST | `/summary/generate` | Generate AI summary |
| POST | `/summary/lead-score` | Calculate lead score |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for frontend dev)
- Java 21+ (for backend dev)
- Python 3.11+ (for AI service dev)

### Run with Docker

```bash
# Clone the repository
git clone https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System.git
cd Multi-Tenant-CRM-System

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
| Frontend | http://localhost |
| Backend API | http://localhost:8080/api |
| AI Service | http://localhost:8001 |
| API Docs | http://localhost:8080/api/swagger-ui.html |

### Default Login
```
Email: admin@demo.com
Password: admin123
```

---

## 🔧 Development Setup

### Backend
```bash
cd backend
./mvnw spring-boot:run
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
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Frontend  │────▶│   Backend   │
│             │     │   (React)   │     │ (Spring)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
┌─────────────┐     ┌─────────────┐     ┌──────▼──────┐
│   Android   │────▶│ AI Service  │────▶│ PostgreSQL  │
│    App      │     │  (FastAPI)  │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
./mvnw test

# Frontend tests
cd frontend
npm test

# AI Service tests
cd ai-service
pytest
```

---

## 📊 Success Metrics

| Metric | Goal | Status |
|--------|------|--------|
| Tenant Data Isolation | 100% | ✅ |
| API Response Time | < 2s | ✅ |
| Test Coverage | ≥ 70% | ✅ |
| Integration Sync Rate | ≥ 95% | ✅ |

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- Dr. Nabeel Mohammed (Supervisor)
- North South University, Department of CSE

---

**Built with ❤️ by Team NeoBit - CSE 327**
