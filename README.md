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

A multi-tenant Customer Relationship Management (CRM) system that allows multiple vendors to manage their customers, interactions, and tasks in isolated environments.

### Key Features

- ✅ **Multi-Tenant Architecture** - Vendor data isolation
- ✅ **Customer Management** - CRUD operations for customers
- ✅ **Interaction Tracking** - Log calls, emails, meetings
- ✅ **Task Management** - Assign and track tasks
- ✅ **OAuth Authentication** - Google & GitHub login
- ✅ **Responsive Web App** - React + TypeScript
- ✅ **Mobile App** - Android (Kotlin)

---

## 📁 Project Structure

```
Multi-Tenant-CRM-System/
│
├── backend/                 # Spring Boot REST API
│   ├── src/main/java/       # Java source code
│   ├── src/main/resources/  # Configuration files
│   ├── pom.xml              # Maven dependencies
│   └── Dockerfile
│
├── frontend/                # React Web Application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API calls
│   │   └── store/           # State management
│   ├── package.json
│   └── Dockerfile
│
├── android/                 # Android Mobile App
│   └── crm-app/             # Kotlin + Jetpack Compose
│
├── docs/                    # Documentation
│   ├── API.md               # API documentation
│   └── ARCHITECTURE.md      # System architecture
│
├── docker-compose.yml       # Container orchestration
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 3.2, Spring Security |
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **Mobile** | Kotlin, Jetpack Compose, Material 3 |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis |
| **Auth** | JWT, OAuth2 (Google, GitHub) |
| **Deployment** | Docker, Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for frontend development)
- Java 21+ (for backend development)

### Run with Docker

```bash
# Clone the repository
git clone https://github.com/Taibur-Rahaman/Multi-Tenant-CRM-System.git
cd Multi-Tenant-CRM-System

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

Access at: http://localhost:5173

---

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/refresh` | Refresh token |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/{id}` | Get customer details |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| POST | `/api/tasks/{id}/complete` | Mark complete |

### Interactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/interactions` | List interactions |
| POST | `/api/interactions` | Log interaction |

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Frontend  │────▶│   Backend   │
│             │     │   (React)   │     │ (Spring)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
┌─────────────┐                          ┌─────▼──────┐
│   Android   │─────────────────────────▶│ PostgreSQL │
│    App      │                          │  Database  │
└─────────────┘                          └────────────┘
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
```

---

## 📱 Screenshots

### Web Dashboard
- Login page with OAuth options
- Customer management dashboard
- Task tracking interface
- Interaction logging

### Android App
- Material 3 design
- Customer list and details
- Task management
- Settings

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- Dr. Nabeel Mohammed (Supervisor)
- North South University, Department of CSE

---

**Built with ❤️ by Team NeoBit**
