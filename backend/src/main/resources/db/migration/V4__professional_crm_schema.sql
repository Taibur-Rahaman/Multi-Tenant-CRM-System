-- =====================================================
-- Multi-Tenant CRM System - Professional Schema Enhancement
-- Version: 4.0 - Enterprise Grade CRM
-- =====================================================

-- =====================================================
-- ENHANCED USER ROLES & PERMISSIONS
-- =====================================================

-- Drop existing role enum constraints if needed
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Create comprehensive role type
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'SUPER_ADMIN',      -- Platform owner - manages all tenants
        'TENANT_ADMIN',     -- Vendor admin - manages their tenant
        'SALES_MANAGER',    -- Manages sales team and pipelines
        'SALES_REP',        -- Sales agent - manages leads and deals
        'SUPPORT_AGENT',    -- Customer support
        'MARKETING',        -- Marketing team member
        'FINANCE',          -- Finance/billing access
        'VIEWER'            -- Read-only access
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Permissions table for granular RBAC
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, role, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_tenant ON role_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- Insert default permissions
INSERT INTO permissions (code, name, description, module) VALUES
    -- Dashboard
    ('dashboard.view', 'View Dashboard', 'Access to main dashboard', 'dashboard'),
    ('dashboard.analytics', 'View Analytics', 'Access to analytics and reports', 'dashboard'),
    
    -- Leads
    ('leads.view', 'View Leads', 'View leads list', 'leads'),
    ('leads.create', 'Create Leads', 'Create new leads', 'leads'),
    ('leads.edit', 'Edit Leads', 'Edit existing leads', 'leads'),
    ('leads.delete', 'Delete Leads', 'Delete leads', 'leads'),
    ('leads.convert', 'Convert Leads', 'Convert leads to contacts/deals', 'leads'),
    ('leads.assign', 'Assign Leads', 'Assign leads to team members', 'leads'),
    ('leads.import', 'Import Leads', 'Bulk import leads', 'leads'),
    ('leads.export', 'Export Leads', 'Export leads data', 'leads'),
    
    -- Contacts
    ('contacts.view', 'View Contacts', 'View contacts list', 'contacts'),
    ('contacts.create', 'Create Contacts', 'Create new contacts', 'contacts'),
    ('contacts.edit', 'Edit Contacts', 'Edit existing contacts', 'contacts'),
    ('contacts.delete', 'Delete Contacts', 'Delete contacts', 'contacts'),
    
    -- Accounts
    ('accounts.view', 'View Accounts', 'View accounts list', 'accounts'),
    ('accounts.create', 'Create Accounts', 'Create new accounts', 'accounts'),
    ('accounts.edit', 'Edit Accounts', 'Edit existing accounts', 'accounts'),
    ('accounts.delete', 'Delete Accounts', 'Delete accounts', 'accounts'),
    
    -- Deals/Opportunities
    ('deals.view', 'View Deals', 'View deals/opportunities', 'deals'),
    ('deals.create', 'Create Deals', 'Create new deals', 'deals'),
    ('deals.edit', 'Edit Deals', 'Edit existing deals', 'deals'),
    ('deals.delete', 'Delete Deals', 'Delete deals', 'deals'),
    ('deals.close', 'Close Deals', 'Mark deals as won/lost', 'deals'),
    
    -- Pipeline
    ('pipeline.view', 'View Pipeline', 'View sales pipeline', 'pipeline'),
    ('pipeline.manage', 'Manage Pipeline', 'Configure pipeline stages', 'pipeline'),
    
    -- Products
    ('products.view', 'View Products', 'View products catalog', 'products'),
    ('products.manage', 'Manage Products', 'Create/edit products', 'products'),
    
    -- Quotes
    ('quotes.view', 'View Quotes', 'View quotes', 'quotes'),
    ('quotes.create', 'Create Quotes', 'Create new quotes', 'quotes'),
    ('quotes.approve', 'Approve Quotes', 'Approve/reject quotes', 'quotes'),
    
    -- Activities
    ('activities.view', 'View Activities', 'View activities/interactions', 'activities'),
    ('activities.create', 'Create Activities', 'Log activities', 'activities'),
    
    -- Tasks
    ('tasks.view', 'View Tasks', 'View tasks', 'tasks'),
    ('tasks.create', 'Create Tasks', 'Create new tasks', 'tasks'),
    ('tasks.assign', 'Assign Tasks', 'Assign tasks to others', 'tasks'),
    
    -- Reports
    ('reports.view', 'View Reports', 'Access reports', 'reports'),
    ('reports.create', 'Create Reports', 'Create custom reports', 'reports'),
    ('reports.export', 'Export Reports', 'Export report data', 'reports'),
    
    -- Settings
    ('settings.view', 'View Settings', 'View tenant settings', 'settings'),
    ('settings.manage', 'Manage Settings', 'Modify tenant settings', 'settings'),
    
    -- Users
    ('users.view', 'View Users', 'View team members', 'users'),
    ('users.manage', 'Manage Users', 'Create/edit/deactivate users', 'users'),
    ('users.roles', 'Manage Roles', 'Assign roles to users', 'users'),
    
    -- Integrations
    ('integrations.view', 'View Integrations', 'View integration settings', 'integrations'),
    ('integrations.manage', 'Manage Integrations', 'Configure integrations', 'integrations'),
    
    -- Admin
    ('admin.tenants', 'Manage Tenants', 'Manage all tenants (super admin)', 'admin'),
    ('admin.billing', 'Manage Billing', 'Access billing and subscriptions', 'admin'),
    ('admin.audit', 'View Audit Logs', 'Access audit trail', 'admin')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SALES PIPELINE & STAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    currency VARCHAR(3) DEFAULT 'USD',
    win_probability_enabled BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipelines_tenant ON pipelines(tenant_id);

CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    win_probability INTEGER DEFAULT 0 CHECK (win_probability >= 0 AND win_probability <= 100),
    color VARCHAR(7) DEFAULT '#6366f1',
    is_won_stage BOOLEAN DEFAULT false,
    is_lost_stage BOOLEAN DEFAULT false,
    rotting_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON pipeline_stages(pipeline_id, position);

-- =====================================================
-- DEALS / OPPORTUNITIES
-- =====================================================

CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id),
    stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    deal_number VARCHAR(50),
    
    -- Financial
    amount DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    expected_revenue DECIMAL(15, 2),
    
    -- Probability & Dates
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
    lost_reason VARCHAR(255),
    won_reason VARCHAR(255),
    
    -- Relationships
    contact_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Source
    lead_source VARCHAR(100),
    campaign_id UUID,
    
    -- Tracking
    last_activity_at TIMESTAMP WITH TIME ZONE,
    stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    days_in_stage INTEGER DEFAULT 0,
    
    -- Custom
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deals_tenant ON deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_account ON deals(account_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_deals_amount ON deals(amount);

-- Deal history for tracking stage changes
CREATE TABLE IF NOT EXISTS deal_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    from_stage_id UUID REFERENCES pipeline_stages(id),
    to_stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    changed_by UUID REFERENCES users(id),
    duration_seconds INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deal_stage_history_deal ON deal_stage_history(deal_id);

-- =====================================================
-- PRODUCTS & PRICE BOOKS
-- =====================================================

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_categories_tenant ON product_categories(tenant_id);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    category_id UUID REFERENCES product_categories(id),
    
    -- Pricing
    unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Billing
    billing_type VARCHAR(20) DEFAULT 'one_time' CHECK (billing_type IN ('one_time', 'recurring', 'usage_based')),
    billing_frequency VARCHAR(20) CHECK (billing_frequency IN ('monthly', 'quarterly', 'yearly', 'custom')),
    
    -- Tax
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    is_taxable BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Stock (optional)
    track_inventory BOOLEAN DEFAULT false,
    quantity_in_stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    
    -- Custom
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(name gin_trgm_ops);

-- Price Books for different pricing tiers
CREATE TABLE IF NOT EXISTS price_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_book_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_book_id UUID NOT NULL REFERENCES price_books(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    unit_price DECIMAL(15, 2) NOT NULL,
    min_quantity INTEGER DEFAULT 1,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(price_book_id, product_id, min_quantity)
);

-- =====================================================
-- QUOTES & PROPOSALS
-- =====================================================

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Reference
    quote_number VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
    
    -- Dates
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    -- Relationships
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES customers(id),
    account_id UUID REFERENCES accounts(id),
    owner_id UUID REFERENCES users(id),
    
    -- Financials
    subtotal DECIMAL(15, 2) DEFAULT 0,
    discount_type VARCHAR(10) CHECK (discount_type IN ('percent', 'amount')),
    discount_value DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Content
    introduction TEXT,
    terms_and_conditions TEXT,
    notes TEXT,
    
    -- Tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    
    -- Custom
    custom_fields JSONB DEFAULT '{}',
    
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, quote_number)
);

CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_deal ON quotes(deal_id);
CREATE INDEX IF NOT EXISTS idx_quotes_contact ON quotes(contact_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Quote line items
CREATE TABLE IF NOT EXISTS quote_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    
    -- Item Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    
    -- Pricing
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    total_price DECIMAL(15, 2) NOT NULL,
    
    -- Ordering
    position INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote ON quote_line_items(quote_id);

-- =====================================================
-- ACTIVITIES (Enhanced)
-- =====================================================

-- Activity types with more detail
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM (
        'call', 'email', 'meeting', 'task', 'note', 
        'sms', 'whatsapp', 'linkedin', 'demo', 'proposal_sent',
        'contract_sent', 'follow_up', 'site_visit'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Type & Status
    activity_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Details
    subject VARCHAR(500) NOT NULL,
    description TEXT,
    outcome TEXT,
    
    -- Timing
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    all_day BOOLEAN DEFAULT false,
    
    -- Location
    location VARCHAR(255),
    location_type VARCHAR(20) CHECK (location_type IN ('in_person', 'phone', 'video', 'online')),
    meeting_link VARCHAR(500),
    
    -- Relationships
    contact_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    
    -- Assignment
    owner_id UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    
    -- Call specific
    call_direction VARCHAR(10) CHECK (call_direction IN ('inbound', 'outbound')),
    call_result VARCHAR(50),
    recording_url VARCHAR(500),
    
    -- Email specific
    email_message_id VARCHAR(255),
    email_thread_id VARCHAR(255),
    
    -- Reminders
    reminder_at TIMESTAMP WITH TIME ZONE,
    reminder_sent BOOLEAN DEFAULT false,
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    parent_activity_id UUID REFERENCES activities(id),
    
    -- Custom
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_tenant ON activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_scheduled ON activities(scheduled_start);

-- Activity participants (for meetings)
CREATE TABLE IF NOT EXISTS activity_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    participant_type VARCHAR(20) NOT NULL CHECK (participant_type IN ('user', 'contact', 'external')),
    user_id UUID REFERENCES users(id),
    contact_id UUID REFERENCES customers(id),
    email VARCHAR(255),
    name VARCHAR(255),
    response_status VARCHAR(20) DEFAULT 'pending' CHECK (response_status IN ('pending', 'accepted', 'declined', 'tentative')),
    is_organizer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON activity_participants(activity_id);

-- =====================================================
-- CAMPAIGNS
-- =====================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'social', 'event', 'webinar', 'advertisement', 'referral', 'content', 'other')),
    
    -- Status & Dates
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    
    -- Budget
    budgeted_cost DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Goals
    expected_revenue DECIMAL(15, 2),
    expected_response INTEGER,
    
    -- Results
    num_sent INTEGER DEFAULT 0,
    num_responses INTEGER DEFAULT 0,
    num_converted INTEGER DEFAULT 0,
    actual_revenue DECIMAL(15, 2) DEFAULT 0,
    
    -- Ownership
    owner_id UUID REFERENCES users(id),
    
    -- Custom
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);

-- Campaign members
CREATE TABLE IF NOT EXISTS campaign_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'sent',
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT campaign_member_contact CHECK (contact_id IS NOT NULL OR lead_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign ON campaign_members(campaign_id);

-- =====================================================
-- NOTES & ATTACHMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    
    -- Relationships (polymorphic)
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Ownership
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Privacy
    is_private BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notes_tenant ON notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);

CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- File Info
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url VARCHAR(500) NOT NULL,
    
    -- Relationships (polymorphic)
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Ownership
    uploaded_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_tenant ON attachments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);

-- =====================================================
-- REPORTS & DASHBOARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS saved_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL,
    
    -- Configuration
    filters JSONB DEFAULT '{}',
    columns JSONB DEFAULT '[]',
    sorting JSONB DEFAULT '{}',
    grouping JSONB DEFAULT '{}',
    chart_config JSONB,
    
    -- Sharing
    is_public BOOLEAN DEFAULT false,
    shared_with_roles TEXT[],
    
    -- Scheduling
    is_scheduled BOOLEAN DEFAULT false,
    schedule_config JSONB,
    last_run_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_reports_tenant ON saved_reports(tenant_id);

CREATE TABLE IF NOT EXISTS custom_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Layout
    layout JSONB NOT NULL DEFAULT '[]',
    
    -- Sharing
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_dashboards_tenant ON custom_dashboards(tenant_id);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL,
    
    -- Reference
    entity_type VARCHAR(50),
    entity_id UUID,
    action_url VARCHAR(500),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery
    channels TEXT[] DEFAULT ARRAY['in_app'],
    email_sent BOOLEAN DEFAULT false,
    push_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- =====================================================
-- SEQUENCES FOR NUMBERING
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS deal_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS issue_number_seq START 1000;

-- Function to generate deal number
CREATE OR REPLACE FUNCTION generate_deal_number(tenant_slug VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN UPPER(tenant_slug) || '-D' || LPAD(nextval('deal_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate quote number
CREATE OR REPLACE FUNCTION generate_quote_number(tenant_slug VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN UPPER(tenant_slug) || '-Q' || LPAD(nextval('quote_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DEFAULT PIPELINE SETUP
-- =====================================================

-- Create a function to set up default pipeline for new tenants
CREATE OR REPLACE FUNCTION setup_default_pipeline(p_tenant_id UUID)
RETURNS UUID AS $$
DECLARE
    v_pipeline_id UUID;
BEGIN
    -- Create default pipeline
    INSERT INTO pipelines (tenant_id, name, description, is_default, is_active)
    VALUES (p_tenant_id, 'Sales Pipeline', 'Default sales pipeline', true, true)
    RETURNING id INTO v_pipeline_id;
    
    -- Create default stages
    INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, position, win_probability, color) VALUES
        (p_tenant_id, v_pipeline_id, 'Qualification', 1, 10, '#6366f1'),
        (p_tenant_id, v_pipeline_id, 'Needs Analysis', 2, 25, '#8b5cf6'),
        (p_tenant_id, v_pipeline_id, 'Proposal', 3, 50, '#a855f7'),
        (p_tenant_id, v_pipeline_id, 'Negotiation', 4, 75, '#d946ef'),
        (p_tenant_id, v_pipeline_id, 'Closed Won', 5, 100, '#22c55e'),
        (p_tenant_id, v_pipeline_id, 'Closed Lost', 6, 0, '#ef4444');
    
    -- Mark won/lost stages
    UPDATE pipeline_stages SET is_won_stage = true 
    WHERE pipeline_id = v_pipeline_id AND name = 'Closed Won';
    
    UPDATE pipeline_stages SET is_lost_stage = true 
    WHERE pipeline_id = v_pipeline_id AND name = 'Closed Lost';
    
    RETURN v_pipeline_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA FOR DEMO TENANT
-- =====================================================

-- Setup default pipeline for demo tenant
SELECT setup_default_pipeline('00000000-0000-0000-0000-000000000001');

-- Add sample products
INSERT INTO products (tenant_id, name, sku, description, unit_price, billing_type, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'CRM Professional', 'CRM-PRO', 'Professional CRM license - per user/month', 49.00, 'recurring', true),
    ('00000000-0000-0000-0000-000000000001', 'CRM Enterprise', 'CRM-ENT', 'Enterprise CRM license - per user/month', 99.00, 'recurring', true),
    ('00000000-0000-0000-0000-000000000001', 'Implementation Service', 'SVC-IMPL', 'One-time implementation and setup', 2500.00, 'one_time', true),
    ('00000000-0000-0000-0000-000000000001', 'Training Package', 'SVC-TRAIN', 'Team training (up to 10 users)', 1500.00, 'one_time', true),
    ('00000000-0000-0000-0000-000000000001', 'Premium Support', 'SUP-PREM', '24/7 premium support - monthly', 299.00, 'recurring', true)
ON CONFLICT DO NOTHING;


