#!/bin/bash

# Multi-Tenant CRM System Setup Script
# =====================================

set -e

echo "🚀 Multi-Tenant CRM System Setup"
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
check_tool() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

echo ""
echo "📋 Checking prerequisites..."
echo ""

check_tool "node" || { echo "Please install Node.js: https://nodejs.org/"; }
check_tool "npm" || { echo "Please install npm"; }
check_tool "docker" || { echo "Please install Docker: https://docs.docker.com/get-docker/"; DOCKER_MISSING=1; }
check_tool "docker-compose" || check_tool "docker" || { DOCKER_MISSING=1; }

echo ""

# Install frontend dependencies
if [ -d "frontend" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
fi

# Install AI service dependencies
if [ -d "ai-service" ] && command -v pip &> /dev/null; then
    echo "📦 Installing AI service dependencies..."
    cd ai-service
    pip install -r requirements.txt 2>/dev/null || pip3 install -r requirements.txt 2>/dev/null || echo -e "${YELLOW}!${NC} Could not install Python dependencies. Please run: pip install -r requirements.txt"
    cd ..
fi

# Setup environment files
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Database
DB_PASSWORD=postgres

# JWT Secret (change in production!)
JWT_SECRET=your-256-bit-secret-key-for-jwt-token-signing-must-be-long-enough

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Telegram (optional)
TELEGRAM_BOT_TOKEN=

# Twilio (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Jira (optional)
JIRA_BASE_URL=
JIRA_EMAIL=
JIRA_API_TOKEN=

# OpenAI (optional - for AI features)
OPENAI_API_KEY=
EOF
    echo -e "${GREEN}✓${NC} Created .env file. Please edit with your configuration."
fi

echo ""
echo "================================="
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "To run the project:"
echo ""
echo "  Option 1: Docker (Recommended)"
echo "  ------------------------------"
echo "  docker-compose up -d"
echo ""
echo "  Option 2: Manual Development"
echo "  ----------------------------"
echo "  Terminal 1 (Database): docker-compose up -d postgres"
echo "  Terminal 2 (Backend):  cd backend && ./mvnw spring-boot:run"
echo "  Terminal 3 (Frontend): cd frontend && npm run dev"
echo "  Terminal 4 (AI):       cd ai-service && uvicorn app.main:app --reload --port 8001"
echo ""
echo "Access the application:"
echo "  Frontend:  http://localhost:5173 (dev) or http://localhost (Docker)"
echo "  Backend:   http://localhost:8080/api"
echo "  AI API:    http://localhost:8001"
echo "  API Docs:  http://localhost:8080/api/swagger-ui.html"
echo ""
echo "Default login: admin@demo.com / admin123"
echo ""

