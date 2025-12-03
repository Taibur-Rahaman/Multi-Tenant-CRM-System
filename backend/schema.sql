-- NeoBit Multi-Tenant CRM System
-- Database Schema (PostgreSQL 15+)
-- 
-- Multi-tenancy Strategy: Row-Level Isolation with Tenant ID
-- Optional: PostgreSQL Row-Level Security (RLS) for additional protection

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREAT EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption functions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram for fuzzy search

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('PLATFORM_ADMIN', 'VENDOR_ADMIN', 'AGENT');
CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING', 'DELETED');
CREATE TYPE tenant_plan AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE interaction_type AS ENUM ('EMAIL', 'CALL', 'CHAT', 'NOTE', 'MEETING', 'TASK');
CREATE TYPE interaction_channel AS ENUM ('GMAIL', 'TELEGRAM', 'ZEGO', 'PHONE', 'MANUAL', 'CLICKUP');
CREATE TYPE interaction_direction AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');
CREATE TYPE integration_type AS ENUM ('GMAIL', 'GOOGLE_CALENDAR', 'TELEGRAM', 'CLICKUP', 'ZEGO');
CREATE TYPE integration_status AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR', 'PENDING');
CREATE TYPE oauth_provider AS ENUM ('GOOGLE', 'GITHUB', 'LOCAL');

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Tenants (Vendors)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    plan tenant_plan NOT NULL DEFAULT 'FREE',
    status tenant_status NOT NULL DEFAULT 'PENDING',
    
    -- Settings (JSONB for flexibility)
    settings JSONB DEFAULT '{
        "timezone": "UTC",
        "dateFormat": "YYYY-MM-DD",
        "language": "en",
        "features": {}
    }'::jsonb,
    
    -- Limits based on plan
    limits JSONB DEFAULT '{
        "maxUsers": 5,
        "maxCustomers": 100,
        "maxStorageGB": 1
    }'::jsonb,
    
    -- Billing (optional)
    billing_email VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic info
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    
    -- Authentication
    password_hash VARCHAR(255), -- NULL for OAuth-only users
    role user_role NOT NULL DEFAULT 'AGENT',
    
    -- OAuth
    oauth_provider oauth_provider,
    oauth_id VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    preferences JSONB DEFAULT '{
        "notifications": true,
        "theme": "system",
        "language": "en"
    }'::jsonb,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(tenant_id, email),
    UNIQUE(oauth_provider, oauth_id) -- Prevent duplicate OAuth accounts
);

-- Refresh Tokens (for JWT authentication)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    -- Security
    device_info JSONB,
    ip_address INET,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    
    -- Address
    address JSONB DEFAULT '{}'::jsonb,
    
    -- Categorization
    tags VARCHAR(50)[] DEFAULT '{}',
    
    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Custom fields (flexible schema)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- External IDs
    external_ids JSONB DEFAULT '{}'::jsonb, -- e.g., telegram_chat_id, clickup_contact_id
    
    -- Stats (denormalized for performance)
    interaction_count INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT customer_has_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Interactions (all customer touchpoints)
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Agent who handled
    
    -- Type and channel
    type interaction_type NOT NULL,
    channel interaction_channel NOT NULL DEFAULT 'MANUAL',
    direction interaction_direction NOT NULL DEFAULT 'INTERNAL',
    
    -- Content
    subject VARCHAR(500),
    content TEXT,
    
    -- Channel-specific metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Examples:
    -- EMAIL: {gmailMessageId, threadId, labels}
    -- CALL: {duration, recordingUrl, zegoRoomId}
    -- TELEGRAM: {messageId, chatId}
    -- CLICKUP: {taskId, taskUrl, status}
    
    -- AI-generated content (Phase 2)
    transcription TEXT,
    summary TEXT,
    sentiment VARCHAR(20), -- POSITIVE, NEUTRAL, NEGATIVE
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INTEGRATION TABLES
-- ============================================================

-- Integration Configurations (per tenant)
CREATE TABLE integration_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    type integration_type NOT NULL,
    status integration_status NOT NULL DEFAULT 'DISCONNECTED',
    
    -- OAuth tokens (encrypted)
    credentials JSONB, -- Encrypted: {accessToken, refreshToken, expiresAt}
    
    -- Integration-specific settings
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Connection info
    connected_account VARCHAR(255), -- Email or username of connected account
    
    -- Sync status
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_cursor VARCHAR(500), -- For incremental sync
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, type)
);

-- Telegram Bot Configuration
CREATE TABLE telegram_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    
    bot_token_encrypted BYTEA NOT NULL, -- Encrypted bot token
    bot_username VARCHAR(255),
    webhook_secret VARCHAR(255),
    
    -- Settings
    welcome_message TEXT DEFAULT 'Hello! How can we help you today?',
    auto_reply_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram Chat Mappings (link Telegram chats to customers)
CREATE TABLE telegram_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    chat_id BIGINT NOT NULL,
    chat_type VARCHAR(20) NOT NULL, -- private, group, supergroup
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, chat_id)
);

-- ============================================================
-- CALENDAR & TASKS
-- ============================================================

-- Calendar Events (synced from Google Calendar)
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Google Calendar data
    google_event_id VARCHAR(255),
    calendar_id VARCHAR(255),
    
    -- Event details
    title VARCHAR(500) NOT NULL,
    description TEXT,
    location VARCHAR(500),
    
    -- Time
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50),
    
    -- Meet link
    meet_link VARCHAR(500),
    
    -- Attendees
    attendees JSONB DEFAULT '[]'::jsonb,
    
    -- Recurrence
    recurrence_rule VARCHAR(500),
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, google_event_id)
);

-- Tasks (synced with ClickUp)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    interaction_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- ClickUp data
    clickup_task_id VARCHAR(255),
    clickup_list_id VARCHAR(255),
    clickup_url VARCHAR(500),
    
    -- Task details
    name VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority INTEGER, -- 1=urgent, 2=high, 3=normal, 4=low
    
    -- Dates
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, clickup_task_id)
);

-- ============================================================
-- VOICE/VIDEO CALLS (ZegoCloud)
-- ============================================================

CREATE TABLE call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Zego room info
    room_id VARCHAR(255) NOT NULL,
    
    -- Participants
    host_user_id UUID REFERENCES users(id),
    participants JSONB DEFAULT '[]'::jsonb,
    
    -- Call details
    call_type VARCHAR(20) NOT NULL, -- VOICE, VIDEO
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, ENDED, FAILED
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Recording
    recording_url VARCHAR(500),
    recording_size_bytes BIGINT,
    
    -- Quality metrics
    quality_metrics JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- AI & ANALYTICS (Phase 2)
-- ============================================================

-- AI Conversation History
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    
    -- Conversation
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{role: 'user'|'assistant', content: '...', timestamp: '...'}]
    
    -- Context
    context JSONB DEFAULT '{}'::jsonb,
    
    -- Analytics
    tokens_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcriptions
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES interactions(id) ON DELETE SET NULL,
    call_session_id UUID REFERENCES call_sessions(id) ON DELETE SET NULL,
    
    -- Source
    source_type VARCHAR(50) NOT NULL, -- CALL_RECORDING, UPLOADED_AUDIO, MEETING
    source_url VARCHAR(500),
    
    -- Processing
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    
    -- Results
    transcription TEXT,
    segments JSONB DEFAULT '[]'::jsonb, -- [{speaker, start, end, text}]
    
    -- Summary (AI-generated)
    summary TEXT,
    action_items JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    duration_seconds INTEGER,
    language VARCHAR(10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- AUDIT & LOGGING
-- ============================================================

-- Audit Log (for compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Tenant isolation indexes (critical for performance)
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_interactions_tenant ON interactions(tenant_id);
CREATE INDEX idx_integration_configs_tenant ON integration_configs(tenant_id);
CREATE INDEX idx_calendar_events_tenant ON calendar_events(tenant_id);
CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX idx_call_sessions_tenant ON call_sessions(tenant_id);

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);

-- Customer lookups
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_assigned ON customers(tenant_id, assigned_to);
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);

-- Interaction lookups
CREATE INDEX idx_interactions_customer ON interactions(customer_id);
CREATE INDEX idx_interactions_user ON interactions(user_id);
CREATE INDEX idx_interactions_type ON interactions(tenant_id, type);
CREATE INDEX idx_interactions_created ON interactions(tenant_id, created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_customers_search ON customers USING GIN(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(company, ''))
);
CREATE INDEX idx_interactions_search ON interactions USING GIN(
    to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(content, ''))
);

-- Telegram chat lookups
CREATE INDEX idx_telegram_chats_chat_id ON telegram_chats(tenant_id, chat_id);

-- Refresh token lookups
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

-- Audit log lookups
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- ROW-LEVEL SECURITY (Optional but recommended)
-- ============================================================

-- Enable RLS on tenant-scoped tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (application sets app.tenant_id before queries)
CREATE POLICY tenant_isolation_customers ON customers
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_interactions ON interactions
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_integration_configs ON integration_configs
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_calendar_events ON calendar_events
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_tasks ON tasks
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_interactions_updated_at
    BEFORE UPDATE ON interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update customer interaction stats
CREATE OR REPLACE FUNCTION update_customer_interaction_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE customers
        SET interaction_count = interaction_count + 1,
            last_interaction_at = NEW.created_at
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_stats
    AFTER INSERT ON interactions
    FOR EACH ROW EXECUTE FUNCTION update_customer_interaction_stats();

-- ============================================================
-- SEED DATA (Development)
-- ============================================================

-- Platform admin tenant (system tenant)
INSERT INTO tenants (id, name, subdomain, plan, status, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'NeoBit Platform',
    'platform',
    'ENTERPRISE',
    'ACTIVE',
    '{"timezone": "UTC", "dateFormat": "YYYY-MM-DD", "language": "en"}'::jsonb
);

-- Demo vendor tenant
INSERT INTO tenants (id, name, subdomain, plan, status, settings)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Demo Company',
    'demo',
    'PROFESSIONAL',
    'ACTIVE',
    '{"timezone": "Asia/Dhaka", "dateFormat": "DD/MM/YYYY", "language": "en"}'::jsonb
);

-- Platform admin user
INSERT INTO users (id, tenant_id, email, name, password_hash, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@neobit.com',
    'Platform Admin',
    '$2a$10$rQj1F3TvQj1F3TvQj1F3Te.rQj1F3TvQj1F3TvQj1F3TvQj1F3TvQ', -- Admin@123!
    'PLATFORM_ADMIN',
    true,
    true
);

-- Demo vendor admin
INSERT INTO users (id, tenant_id, email, name, password_hash, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'vendor@demo.com',
    'Demo Vendor',
    '$2a$10$rQj1F3TvQj1F3TvQj1F3Te.rQj1F3TvQj1F3TvQj1F3TvQj1F3TvQ', -- Vendor@123!
    'VENDOR_ADMIN',
    true,
    true
);

-- Demo agent
INSERT INTO users (id, tenant_id, email, name, password_hash, role, is_active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'agent@demo.com',
    'Demo Agent',
    '$2a$10$rQj1F3TvQj1F3TvQj1F3Te.rQj1F3TvQj1F3TvQj1F3TvQj1F3TvQ', -- Agent@123!
    'AGENT',
    true,
    true
);

-- Demo customers
INSERT INTO customers (id, tenant_id, name, email, phone, company, tags, assigned_to, metadata)
VALUES 
(
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'John Doe',
    'john@customer.com',
    '+8801712345678',
    'Customer Corp',
    ARRAY['vip', 'enterprise'],
    '00000000-0000-0000-0000-000000000003',
    '{"source": "website", "industry": "Technology"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000002',
    'Jane Smith',
    'jane@example.com',
    '+8801798765432',
    'Example Inc',
    ARRAY['new', 'lead'],
    '00000000-0000-0000-0000-000000000003',
    '{"source": "referral", "industry": "Finance"}'::jsonb
);

-- Demo interactions
INSERT INTO interactions (tenant_id, customer_id, user_id, type, channel, direction, subject, content)
VALUES 
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000003',
    'EMAIL',
    'GMAIL',
    'INBOUND',
    'Product Inquiry',
    'Hi, I''m interested in your enterprise plan. Can we schedule a call?'
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000003',
    'NOTE',
    'MANUAL',
    'INTERNAL',
    'Meeting Notes',
    'Discussed Q2 requirements. Customer needs mobile integration and has budget of $50,000.'
);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE tenants IS 'Multi-tenant vendors/organizations';
COMMENT ON TABLE users IS 'System users with tenant association';
COMMENT ON TABLE customers IS 'CRM customers belonging to tenants';
COMMENT ON TABLE interactions IS 'All customer interactions (emails, calls, chats, notes)';
COMMENT ON TABLE integration_configs IS 'Third-party integration configurations per tenant';
COMMENT ON TABLE telegram_configs IS 'Telegram bot configuration per tenant';
COMMENT ON TABLE telegram_chats IS 'Telegram chat to customer mappings';
COMMENT ON TABLE call_sessions IS 'Voice/video call sessions via ZegoCloud';
COMMENT ON TABLE audit_logs IS 'System audit trail for compliance';

-- ============================================================
-- GRANTS (adjust based on your database user setup)
-- ============================================================

-- Application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO neobit_app;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO neobit_app;

-- Read-only user for reporting
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO neobit_readonly;




