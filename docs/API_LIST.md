# API Configuration List - Multi-Tenant CRM System

## 📋 Complete List of APIs Found in Codebase

This document provides a comprehensive list of all APIs and integrations found in the codebase that require configuration.

---

## 🔴 Required APIs (Must Configure for Basic Functionality)

### 1. **OpenAI API** 
- **Purpose:** AI chat assistant, voice transcription, summarization, lead scoring
- **Location:** `ai-service/app/config.py`
- **Environment Variable:** `OPENAI_API_KEY`
- **Configuration File:** `ai-service/app/config.py`, `backend/src/main/resources/application.yml`
- **Status:** ⚠️ **NOT CONFIGURED** (Empty default: `""`)
- **Required for:** AI features, chat, voice commands, meeting prep

### 2. **Email Service (SMTP)**
- **Purpose:** Send transactional emails, notifications, system alerts
- **Location:** `backend/src/main/resources/application.yml` (lines 71-81)
- **Environment Variables:** 
  - `MAIL_USER` (required)
  - `MAIL_PASSWORD` (required)
- **Default Provider:** Gmail SMTP (smtp.gmail.com:587)
- **Status:** ⚠️ **NOT CONFIGURED** (No default values)
- **Required for:** Email notifications, password resets, alerts

### 3. **JWT Secret**
- **Purpose:** Sign and verify authentication tokens
- **Location:** `backend/src/main/resources/application.yml` (line 85), `ai-service/app/config.py` (line 19)
- **Environment Variable:** `JWT_SECRET`
- **Default Value:** `"your-256-bit-secret-key-for-jwt-token-signing"` ⚠️ **INSECURE DEFAULT**
- **Status:** ⚠️ **USING INSECURE DEFAULT** - Must be changed!
- **Required for:** User authentication, token security

---

## 🟡 Optional APIs (Configure Based on Feature Requirements)

### 4. **Google OAuth (Gmail & Calendar)**
- **Purpose:** OAuth login, Gmail email sync, Google Calendar integration
- **Location:** `backend/src/main/resources/application.yml` (lines 36-46, 123-126)
- **Environment Variables:**
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI` (optional, has default)
- **Implementation:** `backend/src/main/java/com/neobit/crm/integration/gmail/GmailService.kt`
- **Status:** ❌ **NOT CONFIGURED** (Empty defaults)
- **Used for:** 
  - Gmail email reading/sending
  - Google Calendar events
  - OAuth authentication

### 5. **GitHub OAuth**
- **Purpose:** OAuth authentication via GitHub
- **Location:** `backend/src/main/resources/application.yml` (lines 47-53, 128-131)
- **Environment Variables:**
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GITHUB_REDIRECT_URI` (optional, has default)
- **Status:** ❌ **NOT CONFIGURED** (Empty defaults)
- **Used for:** GitHub OAuth login

### 6. **Twilio (Telephony)**
- **Purpose:** Make/receive phone calls, send SMS from CRM
- **Location:** `backend/src/main/resources/application.yml` (lines 114-119, 133-136)
- **Environment Variables:**
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
- **Implementation:** `backend/src/main/java/com/neobit/crm/integration/telephony/TelephonyService.kt`
- **Status:** ❌ **NOT CONFIGURED** (Empty defaults)
- **Used for:** Voice calls, SMS messaging, telephony features

### 7. **Telegram Bot API**
- **Purpose:** Send notifications, receive messages via Telegram
- **Location:** `backend/src/main/resources/application.yml` (lines 99-101, 138-140)
- **Environment Variables:**
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_BOT_USERNAME`
  - `TELEGRAM_WEBHOOK_SECRET` (optional)
- **Implementation:** `backend/src/main/java/com/neobit/crm/integration/telegram/TelegramService.kt`
- **Status:** ❌ **NOT CONFIGURED** (Empty defaults)
- **Used for:** Telegram notifications, bot messaging

### 8. **Jira API**
- **Purpose:** Create and track issues from customer interactions
- **Location:** `backend/src/main/resources/application.yml` (lines 104-107, 142-145)
- **Environment Variables:**
  - `JIRA_BASE_URL`
  - `JIRA_EMAIL`
  - `JIRA_API_TOKEN`
- **Implementation:** `backend/src/main/java/com/neobit/crm/integration/jira/JiraService.kt`
- **Status:** ❌ **NOT CONFIGURED** (Empty defaults)
- **Used for:** Issue tracking, project management integration

### 9. **Linear API**
- **Purpose:** Sync issues and project management with Linear
- **Location:** `backend/src/main/resources/application.yml` (lines 110-111)
- **Environment Variable:** `LINEAR_API_KEY`
- **Status:** ❌ **NOT CONFIGURED** (Empty default)
- **Used for:** Linear issue tracking integration

### 10. **ElasticSearch**
- **Purpose:** Advanced search functionality across CRM data
- **Location:** `backend/src/main/resources/application.yml` (lines 65-68)
- **Environment Variables:**
  - `ELASTICSEARCH_URI` (default: `http://localhost:9200`)
  - `ELASTICSEARCH_USER` (default: `elastic`)
  - `ELASTICSEARCH_PASSWORD` (default: `changeme`)
- **Status:** ✅ **USING DEFAULTS** (Configured in docker-compose.yml)
- **Note:** Defaults work for local development but should be changed for production

---

## 📊 Configuration Status Summary

| # | API/Service | Required? | Status | Configuration File | Notes |
|---|-------------|-----------|--------|-------------------|-------|
| 1 | OpenAI | ✅ Yes | ⚠️ Not Configured | `ai-service/app/config.py` | Empty string default |
| 2 | Email (SMTP) | ✅ Yes | ⚠️ Not Configured | `application.yml` | No defaults |
| 3 | JWT Secret | ✅ Yes | ⚠️ Insecure Default | `application.yml` | Must change! |
| 4 | Google OAuth | ❌ No | ❌ Not Configured | `application.yml` | For Gmail/Calendar |
| 5 | GitHub OAuth | ❌ No | ❌ Not Configured | `application.yml` | OAuth login |
| 6 | Twilio | ❌ No | ❌ Not Configured | `application.yml` | Telephony |
| 7 | Telegram Bot | ❌ No | ❌ Not Configured | `application.yml` | Notifications |
| 8 | Jira | ❌ No | ❌ Not Configured | `application.yml` | Issue tracking |
| 9 | Linear | ❌ No | ❌ Not Configured | `application.yml` | Project mgmt |
| 10 | ElasticSearch | ❌ No | ✅ Using Defaults | `application.yml` | Local dev OK |

---

## 🔍 Where APIs Are Referenced in Code

### Backend Configuration
- **Primary Config:** `backend/src/main/resources/application.yml`
- **Integration Config Class:** `backend/src/main/java/com/neobit/crm/config/IntegrationConfig.kt`
- **Services:**
  - Gmail: `backend/src/main/java/com/neobit/crm/integration/gmail/GmailService.kt`
  - Telegram: `backend/src/main/java/com/neobit/crm/integration/telegram/TelegramService.kt`
  - Jira: `backend/src/main/java/com/neobit/crm/integration/jira/JiraService.kt`
  - Twilio: `backend/src/main/java/com/neobit/crm/integration/telephony/TelephonyService.kt`

### AI Service Configuration
- **Primary Config:** `ai-service/app/config.py`
- **Uses:** OpenAI API for all AI features

### Docker Configuration
- **docker-compose.yml:** Contains some environment variable mappings
- **Backend service:** Maps Google OAuth, JWT, DB credentials
- **AI service:** Maps OpenAI API key

---

## 🚨 Critical Issues Found

1. **JWT_SECRET using insecure default** - Must be changed immediately!
2. **OpenAI API key not configured** - AI features will not work
3. **Email service not configured** - Email notifications will fail
4. **Many optional APIs not configured** - Related features unavailable

---

## 📝 Next Steps

1. **Review:** Read [API_SETUP_GUIDE.md](./API_SETUP_GUIDE.md) for detailed setup instructions
2. **Checklist:** Use [API_CONFIGURATION_CHECKLIST.md](./API_CONFIGURATION_CHECKLIST.md) to track progress
3. **Configure:** Start with required APIs, then add optional ones as needed
4. **Test:** Verify each integration after configuration

---

## 📚 Related Documentation

- **Setup Guide:** [API_SETUP_GUIDE.md](./API_SETUP_GUIDE.md) - Step-by-step instructions
- **Checklist:** [API_CONFIGURATION_CHECKLIST.md](./API_CONFIGURATION_CHECKLIST.md) - Quick reference
- **Environment Template:** [env.example](./env.example) - All environment variables

---

**Generated:** From codebase analysis
**Last Updated:** Current date
**Files Analyzed:** 
- `backend/src/main/resources/application.yml`
- `ai-service/app/config.py`
- `backend/src/main/java/com/neobit/crm/config/IntegrationConfig.kt`
- Integration service files
- `docker-compose.yml`
- `env.example`

