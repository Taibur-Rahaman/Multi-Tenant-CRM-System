# API Configuration Checklist

Quick reference checklist for setting up all APIs in the Multi-Tenant CRM System.

## 🔴 Required APIs (Must Configure)

### ✅ 1. OpenAI API
- [ ] Created OpenAI account at platform.openai.com
- [ ] Generated API key (starts with `sk-`)
- [ ] Added billing information
- [ ] Added to `.env`: `OPENAI_API_KEY=sk-...`
- [ ] Tested: AI chat endpoint responds

**Status:** ⚠️ **NOT CONFIGURED** - Required for AI features

---

### ✅ 2. Email Service (SMTP)
- [ ] Chose email provider (Gmail/SendGrid/Mailgun)
- [ ] Set up Gmail app password OR
- [ ] Obtained SMTP credentials from provider
- [ ] Added to `.env`:
  - `MAIL_USER=your-email@gmail.com`
  - `MAIL_PASSWORD=your-app-password`
- [ ] Tested: Email sending works

**Status:** ⚠️ **NOT CONFIGURED** - Required for email notifications

---

### ✅ 3. JWT Secret
- [ ] Generated secure 256-bit secret key
- [ ] Added to `.env`: `JWT_SECRET=your-secure-key-here`
- [ ] **Changed from default value** (important for production!)

**Status:** ⚠️ **USING DEFAULT** - Should be changed for security

---

## 🟡 Optional APIs (Configure as Needed)

### 4. Google OAuth (Gmail & Calendar)
- [ ] Created Google Cloud project
- [ ] Enabled Gmail API
- [ ] Enabled Google Calendar API
- [ ] Created OAuth 2.0 credentials
- [ ] Configured OAuth consent screen
- [ ] Added redirect URIs
- [ ] Added to `.env`:
  - `GOOGLE_CLIENT_ID=...`
  - `GOOGLE_CLIENT_SECRET=...`
- [ ] Tested: OAuth login works

**Status:** ❌ **NOT CONFIGURED** - Optional

---

### 5. GitHub OAuth
- [ ] Created GitHub OAuth App
- [ ] Set authorization callback URL
- [ ] Generated client secret
- [ ] Added to `.env`:
  - `GITHUB_CLIENT_ID=...`
  - `GITHUB_CLIENT_SECRET=...`
- [ ] Tested: GitHub login works

**Status:** ❌ **NOT CONFIGURED** - Optional

---

### 6. Twilio (Telephony)
- [ ] Created Twilio account
- [ ] Obtained Account SID
- [ ] Obtained Auth Token
- [ ] Purchased/obtained phone number
- [ ] Added to `.env`:
  - `TWILIO_ACCOUNT_SID=AC...`
  - `TWILIO_AUTH_TOKEN=...`
  - `TWILIO_PHONE_NUMBER=+1...`
- [ ] Tested: Call initiation works

**Status:** ❌ **NOT CONFIGURED** - Optional

---

### 7. Telegram Bot
- [ ] Created bot via @BotFather
- [ ] Obtained bot token
- [ ] Noted bot username
- [ ] Added to `.env`:
  - `TELEGRAM_BOT_TOKEN=...`
  - `TELEGRAM_BOT_USERNAME=...`
- [ ] Tested: Bot responds to messages

**Status:** ❌ **NOT CONFIGURED** - Optional

---

### 8. Jira API
- [ ] Have Jira Cloud account
- [ ] Obtained Jira site URL
- [ ] Created API token
- [ ] Added to `.env`:
  - `JIRA_BASE_URL=https://...atlassian.net`
  - `JIRA_EMAIL=...`
  - `JIRA_API_TOKEN=...`
- [ ] Tested: Issue creation works

**Status:** ❌ **NOT CONFIGURED** - Optional

---

### 9. Linear API
- [ ] Created Linear account
- [ ] Generated API key
- [ ] Selected appropriate scopes
- [ ] Added to `.env`: `LINEAR_API_KEY=...`
- [ ] Tested: Issue sync works

**Status:** ❌ **NOT CONFIGURED** - Optional

---

### 10. ElasticSearch
- [ ] Verified ElasticSearch is running (via docker-compose)
- [ ] Changed default password (recommended)
- [ ] Added to `.env` (if different from defaults):
  - `ELASTICSEARCH_URI=...`
  - `ELASTICSEARCH_USER=...`
  - `ELASTICSEARCH_PASSWORD=...`

**Status:** ✅ **USING DEFAULTS** - Works for local dev

---

## 📊 Configuration Summary

| API | Status | Priority | Configured |
|-----|--------|----------|------------|
| OpenAI | ⚠️ Not Configured | **Required** | ❌ |
| Email (SMTP) | ⚠️ Not Configured | **Required** | ❌ |
| JWT Secret | ⚠️ Using Default | **Required** | ⚠️ |
| Google OAuth | ❌ Not Configured | Optional | ❌ |
| GitHub OAuth | ❌ Not Configured | Optional | ❌ |
| Twilio | ❌ Not Configured | Optional | ❌ |
| Telegram Bot | ❌ Not Configured | Optional | ❌ |
| Jira | ❌ Not Configured | Optional | ❌ |
| Linear | ❌ Not Configured | Optional | ❌ |
| ElasticSearch | ✅ Using Defaults | Optional | ✅ |

---

## 🚀 Quick Start Steps

1. **Copy environment template:**
   ```bash
   cp env.example .env
   ```

2. **Configure Required APIs:**
   - [ ] Set up OpenAI API key
   - [ ] Set up email service (SMTP)
   - [ ] Generate and set JWT secret

3. **Configure Optional APIs as needed:**
   - Review which integrations you want to use
   - Follow setup guide for each

4. **Verify Configuration:**
   - Check all environment variables are set
   - Test each integration endpoint
   - Review application logs for errors

---

## 📖 Detailed Setup Instructions

For step-by-step setup instructions for each API, see:
👉 **[API_SETUP_GUIDE.md](./API_SETUP_GUIDE.md)**

---

## 🔍 How to Check Current Configuration

### View Current Environment Variables:
```bash
# Backend service
docker-compose exec backend env | grep -E "(OPENAI|MAIL|JWT|GOOGLE|TWILIO|TELEGRAM|JIRA|LINEAR)"

# AI Service
docker-compose exec ai-service env | grep -E "(OPENAI|JWT)"
```

### Check Configuration Files:
- Backend: `backend/src/main/resources/application.yml`
- AI Service: `ai-service/app/config.py`
- Environment: `.env` (create from `env.example`)

---

## ⚠️ Important Notes

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use different keys for dev/staging/prod**
3. **Rotate secrets regularly** in production
4. **Test each integration** after configuration
5. **Monitor API usage** to avoid unexpected costs

---

**Last Updated:** Generated from codebase analysis
**Next Steps:** Configure required APIs, then optional ones as needed

