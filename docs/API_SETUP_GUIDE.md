# API Setup Guide - Multi-Tenant CRM System

This document provides a comprehensive list of all APIs that need to be configured and step-by-step setup instructions for each integration.

## 📋 API Configuration Checklist

### ✅ Required APIs (Must Configure)
1. **OpenAI API** - AI features (chat, voice, summarization)
2. **Email Service (SMTP)** - Email notifications
3. **JWT Secret** - Security token signing

### 🔧 Optional APIs (Configure as Needed)
4. **Google OAuth** - Gmail & Calendar integration
5. **GitHub OAuth** - OAuth authentication
6. **Twilio** - Telephony/Calls
7. **Telegram Bot** - Notifications & messaging
8. **Jira API** - Issue tracking
9. **Linear API** - Project management
10. **ElasticSearch** - Search functionality (credentials)

---

## 🔑 Step-by-Step API Setup Instructions

### 1. OpenAI API (Required for AI Features)

**Purpose:** Powers AI chat assistant, voice transcription, summarization, and lead scoring.

**Setup Steps:**

1. **Create OpenAI Account**
   - Go to [https://platform.openai.com](https://platform.openai.com)
   - Sign up or log in
   
2. **Generate API Key**
   - Navigate to: Settings → API Keys
   - Click "Create new secret key"
   - Give it a name (e.g., "CRM-AI-Service")
   - Copy the key immediately (it won't be shown again)
   - Format: `sk-...`

3. **Add Billing Information**
   - Go to: Settings → Billing
   - Add payment method (required to use API)
   - Set usage limits if desired

4. **Configure in Application**
   - Add to `.env` file:
   ```bash
   OPENAI_API_KEY=sk-your-api-key-here
   ```
   - Or set in environment variables

5. **Verify Configuration**
   - Check `ai-service/app/config.py` expects: `OPENAI_API_KEY`
   - Default model: `gpt-3.5-turbo` (configurable)
   - Can upgrade to `gpt-4` in config

**Environment Variables:**
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Model name (default: gpt-3.5-turbo)

**Documentation:** [https://platform.openai.com/docs](https://platform.openai.com/docs)

---

### 2. Email Service (SMTP) - Required

**Purpose:** Sends transactional emails, notifications, and system alerts.

**Setup Steps for Gmail:**

1. **Use Gmail Account**
   - Use existing Gmail account or create new one for CRM

2. **Enable 2-Factor Authentication**
   - Go to: Google Account → Security
   - Enable 2-Step Verification

3. **Generate App Password**
   - Go to: Google Account → Security → 2-Step Verification
   - Scroll to "App passwords"
   - Select "Mail" and device type
   - Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

4. **Configure in Application**
   - Add to `.env` file:
   ```bash
   MAIL_USER=your-email@gmail.com
   MAIL_PASSWORD=your-16-char-app-password
   ```

**Alternative: Use Other SMTP Providers**

- **SendGrid:**
  ```bash
  MAIL_HOST=smtp.sendgrid.net
  MAIL_PORT=587
  MAIL_USER=apikey
  MAIL_PASSWORD=your-sendgrid-api-key
  ```

- **Mailgun:**
  ```bash
  MAIL_HOST=smtp.mailgun.org
  MAIL_PORT=587
  MAIL_USER=your-mailgun-username
  MAIL_PASSWORD=your-mailgun-password
  ```

**Environment Variables:**
- `MAIL_USER` - SMTP username
- `MAIL_PASSWORD` - SMTP password
- `MAIL_HOST` - SMTP host (default: smtp.gmail.com)
- `MAIL_PORT` - SMTP port (default: 587)

---

### 3. JWT Secret - Required

**Purpose:** Signs and verifies authentication tokens.

**Setup Steps:**

1. **Generate a Secure Secret**
   - Use a long, random string (minimum 256 bits = 32 characters)
   - Can use OpenSSL:
   ```bash
   openssl rand -base64 32
   ```
   - Or online generator: [https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx](https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx)

2. **Configure in Application**
   - Add to `.env` file:
   ```bash
   JWT_SECRET=your-256-bit-secret-key-here-make-it-long-and-secure
   ```
   - **IMPORTANT:** Change default in production!

**Environment Variables:**
- `JWT_SECRET` - Secret key for JWT signing (256+ bits recommended)

---

### 4. Google OAuth (Gmail & Calendar) - Optional

**Purpose:** OAuth authentication, Gmail email sync, Google Calendar integration.

**Setup Steps:**

1. **Create Google Cloud Project**
   - Go to [https://console.cloud.google.com](https://console.cloud.google.com)
   - Click "New Project"
   - Enter project name (e.g., "Multi-Tenant CRM")
   - Click "Create"

2. **Enable Required APIs**
   - Go to: APIs & Services → Library
   - Enable these APIs:
     - **Gmail API**
     - **Google Calendar API**
     - **Google OAuth2 API** (usually auto-enabled)

3. **Create OAuth 2.0 Credentials**
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure OAuth consent screen:
     - User Type: External (or Internal if using Google Workspace)
     - App name: "Multi-Tenant CRM"
     - User support email: your email
     - Developer contact: your email
     - Add scopes:
       - `https://www.googleapis.com/auth/gmail.readonly`
       - `https://www.googleapis.com/auth/gmail.send`
       - `https://www.googleapis.com/auth/calendar`
     - Save and continue through steps

4. **Create OAuth Client ID**
   - Application type: "Web application"
   - Name: "CRM Backend"
   - Authorized redirect URIs:
     - `http://localhost:8080/api/oauth2/callback/google` (development)
     - `https://yourdomain.com/api/oauth2/callback/google` (production)
   - Click "Create"
   - Copy **Client ID** and **Client Secret**

5. **Configure in Application**
   - Add to `.env` file:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:8080/api/oauth2/callback/google
   ```

**Environment Variables:**
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URI

**Documentation:** [https://developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)

---

### 5. GitHub OAuth - Optional

**Purpose:** OAuth authentication via GitHub.

**Setup Steps:**

1. **Create GitHub OAuth App**
   - Go to: GitHub → Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"

2. **Configure OAuth App**
   - Application name: "Multi-Tenant CRM"
   - Homepage URL: `http://localhost:3000` (or your domain)
   - Authorization callback URL:
     - `http://localhost:8080/api/oauth2/callback/github` (development)
     - `https://yourdomain.com/api/oauth2/callback/github` (production)
   - Click "Register application"

3. **Get Credentials**
   - Copy **Client ID**
   - Generate **Client Secret** (click "Generate a new client secret")
   - Copy the secret immediately

4. **Configure in Application**
   - Add to `.env` file:
   ```bash
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GITHUB_REDIRECT_URI=http://localhost:8080/api/oauth2/callback/github
   ```

**Environment Variables:**
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `GITHUB_REDIRECT_URI` - OAuth redirect URI

**Documentation:** [https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)

---

### 6. Twilio (Telephony) - Optional

**Purpose:** Make and receive phone calls, send SMS from CRM.

**Setup Steps:**

1. **Create Twilio Account**
   - Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Sign up (free trial includes $15.50 credit)

2. **Get Account Credentials**
   - Dashboard shows:
     - **Account SID** (format: `AC...`)
     - **Auth Token** (click "show" to reveal)
   - Copy both

3. **Get Phone Number**
   - Go to: Phone Numbers → Manage → Buy a number
   - Select country and requirements
   - Purchase number (free trial includes one number)
   - Copy the phone number (format: `+1234567890`)

4. **Configure in Application**
   - Add to `.env` file:
   ```bash
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

**Environment Variables:**
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number

**Documentation:** [https://www.twilio.com/docs](https://www.twilio.com/docs)

**Pricing:** Pay-per-use, free trial available

---

### 7. Telegram Bot - Optional

**Purpose:** Send notifications and receive messages via Telegram.

**Setup Steps:**

1. **Create Telegram Bot**
   - Open Telegram app
   - Search for `@BotFather`
   - Start conversation with BotFather

2. **Create New Bot**
   - Send command: `/newbot`
   - Enter bot name (e.g., "CRM Assistant")
   - Enter bot username (must end with `bot`, e.g., `my_crm_bot`)
   - BotFather will provide a **Bot Token**

3. **Get Bot Username**
   - Note your bot's username (e.g., `@my_crm_bot`)
   - You can also get bot info with `/mybots`

4. **Configure Webhook (Optional)**
   - Set webhook URL (for receiving messages):
     ```bash
     curl -F "url=https://yourdomain.com/api/webhooks/telegram" \
          https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
     ```

5. **Configure in Application**
   - Add to `.env` file:
   ```bash
   TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
   TELEGRAM_BOT_USERNAME=your_bot_username
   TELEGRAM_WEBHOOK_SECRET=optional-webhook-secret
   ```

**Environment Variables:**
- `TELEGRAM_BOT_TOKEN` - Bot token from BotFather
- `TELEGRAM_BOT_USERNAME` - Bot username (without @)
- `TELEGRAM_WEBHOOK_SECRET` - Optional webhook secret

**Documentation:** [https://core.telegram.org/bots/api](https://core.telegram.org/bots/api)

---

### 8. Jira API - Optional

**Purpose:** Create and track issues from customer interactions.

**Setup Steps:**

1. **Have Jira Account**
   - Use existing Jira Cloud account
   - Or sign up at [https://www.atlassian.com/software/jira](https://www.atlassian.com/software/jira)

2. **Get Jira Site URL**
   - Your Jira URL format: `https://your-domain.atlassian.net`
   - Note the base URL

3. **Create API Token**
   - Go to: Atlassian Account Settings → Security → API tokens
   - Click "Create API token"
   - Give it a label (e.g., "CRM Integration")
   - Copy the token immediately

4. **Get Your Email**
   - Use the email associated with your Jira account

5. **Configure in Application**
   - Add to `.env` file:
   ```bash
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-api-token
   ```

**Environment Variables:**
- `JIRA_BASE_URL` - Your Jira site URL
- `JIRA_EMAIL` - Your Jira account email
- `JIRA_API_TOKEN` - API token from Atlassian

**Documentation:** [https://developer.atlassian.com/cloud/jira/platform/rest/v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3)

---

### 9. Linear API - Optional

**Purpose:** Sync issues and project management with Linear.

**Setup Steps:**

1. **Create Linear Account**
   - Go to [https://linear.app](https://linear.app)
   - Sign up or log in

2. **Generate API Key**
   - Go to: Settings → API
   - Click "Create API Key"
   - Give it a name (e.g., "CRM Integration")
   - Select scopes:
     - `read` - Read issues
     - `write` - Create/update issues
   - Copy the API key

3. **Get Workspace Info**
   - Note your workspace name (used in API calls)

4. **Configure in Application**
   - Add to `.env` file:
   ```bash
   LINEAR_API_KEY=your-linear-api-key
   ```

**Environment Variables:**
- `LINEAR_API_KEY` - Linear API key

**Documentation:** [https://linear.app/docs/api](https://linear.app/docs/api)

---

### 10. ElasticSearch Credentials - Optional

**Purpose:** Advanced search functionality.

**Note:** ElasticSearch is already configured in docker-compose.yml, but you may need to set credentials.

**Setup Steps:**

1. **Check Default Configuration**
   - Default username: `elastic`
   - Default password: `changeme` (in docker-compose)

2. **Generate Secure Password (Recommended)**
   - Change default password for security
   - Update in docker-compose.yml or use environment variables

3. **Configure in Application**
   - Add to `.env` file (if different from defaults):
   ```bash
   ELASTICSEARCH_URI=http://localhost:9200
   ELASTICSEARCH_USER=elastic
   ELASTICSEARCH_PASSWORD=your-secure-password
   ```

**Environment Variables:**
- `ELASTICSEARCH_URI` - ElasticSearch URL (default: http://localhost:9200)
- `ELASTICSEARCH_USER` - Username (default: elastic)
- `ELASTICSEARCH_PASSWORD` - Password (default: changeme)

**Documentation:** [https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)

---

## 📝 Complete .env File Template

Create a `.env` file in the project root with all configured values:

```bash
# Database
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres

# JWT Secret (REQUIRED - Generate secure key!)
JWT_SECRET=your-256-bit-secret-key-for-jwt-token-signing-must-be-long-and-secure

# OpenAI API (REQUIRED for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Email Service (REQUIRED)
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password

# Google OAuth (Optional - for Gmail & Calendar)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/oauth2/callback/google

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:8080/api/oauth2/callback/github

# Twilio (Optional - for Telephony)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_WEBHOOK_SECRET=optional-webhook-secret

# Jira (Optional)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Linear (Optional)
LINEAR_API_KEY=your-linear-api-key

# ElasticSearch (Optional - defaults work for local dev)
ELASTICSEARCH_URI=http://localhost:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=changeme

# CORS Origins (Optional)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Server Port (Optional)
SERVER_PORT=8080

# AI Service URL (Optional)
AI_SERVICE_URL=http://localhost:8001
```

---

## ✅ Verification Steps

After configuring each API, verify the setup:

### 1. **OpenAI**
   - Start the AI service
   - Test chat endpoint: `POST /chat/`
   - Check logs for authentication errors

### 2. **Email**
   - Trigger a test email from the application
   - Check SMTP connection logs

### 3. **Google OAuth**
   - Navigate to: `/api/auth/oauth/providers`
   - Verify Google appears in the list
   - Try OAuth login flow

### 4. **Twilio**
   - Check Twilio dashboard for API calls
   - Test call initiation from CRM

### 5. **Telegram**
   - Send test message via bot
   - Verify bot responds

### 6. **Jira**
   - Create a test issue from CRM
   - Verify it appears in Jira

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use environment-specific secrets** - Different keys for dev/staging/prod
3. **Rotate keys regularly** - Especially JWT_SECRET and API keys
4. **Use least privilege** - Only grant necessary API scopes
5. **Monitor API usage** - Set up alerts for unusual activity
6. **Use secrets management** - Consider AWS Secrets Manager, HashiCorp Vault for production

---

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [Twilio Getting Started](https://www.twilio.com/docs/quickstart)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3)
- [Linear API Docs](https://linear.app/docs/api)

---

## 🆘 Troubleshooting

### Common Issues:

1. **OpenAI API Error: "Incorrect API key"**
   - Verify key starts with `sk-`
   - Check for extra spaces or newlines
   - Ensure billing is set up

2. **Email Not Sending**
   - Verify app password for Gmail
   - Check SMTP host/port settings
   - Check firewall/network restrictions

3. **OAuth Redirect URI Mismatch**
   - Ensure redirect URI matches exactly (including http/https, port, path)
   - Check for trailing slashes

4. **API Rate Limiting**
   - Check API provider dashboard for rate limits
   - Implement retry logic or upgrade plan

---

**Last Updated:** Generated from codebase analysis
**Maintained by:** Development Team

