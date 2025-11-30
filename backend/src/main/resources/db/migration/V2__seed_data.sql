-- =====================================================
-- Multi-Tenant CRM System - Seed Data
-- =====================================================

-- Create default tenant for development
INSERT INTO tenants (id, name, slug, domain, subscription_plan, max_users) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Demo Company', 'demo', 'demo.localhost', 'professional', 50);

-- Create admin user (password: admin123)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, email_verified) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
     'admin@demo.com', '$2a$10$QJwKbfrZwWxJFkg2i2KfW./C5gcgzCB5/e/8CdC4QE0PXAyHwZkcS', 
     'Admin', 'User', 'ADMIN', true);

-- Create agent user (password: agent123)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, email_verified) VALUES
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 
     'agent@demo.com', '$2a$10$00FJvqfto0v/En0tD5zzKu3GLDu9GY1nK0eUh2ag9pADxn7bptDZe', 
     'Sales', 'Agent', 'AGENT', true);

-- Create sample accounts
INSERT INTO accounts (id, tenant_id, name, industry, website, phone, city, country, owner_id, tags) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'Acme Corporation', 'Technology', 'https://acme.com', '+1-555-0100', 'San Francisco', 'USA',
     '00000000-0000-0000-0000-000000000001', ARRAY['enterprise', 'tech']),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'Global Industries', 'Manufacturing', 'https://globalind.com', '+1-555-0200', 'Chicago', 'USA',
     '00000000-0000-0000-0000-000000000002', ARRAY['manufacturing', 'large']);

-- Create sample customers
INSERT INTO customers (id, tenant_id, account_id, first_name, last_name, email, phone, job_title, lead_status, owner_id, tags) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001', 'John', 'Smith', 'john.smith@acme.com', '+1-555-0101',
     'CTO', 'qualified', '00000000-0000-0000-0000-000000000001', ARRAY['decision-maker', 'tech']),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001', 'Jane', 'Doe', 'jane.doe@acme.com', '+1-555-0102',
     'VP Engineering', 'contacted', '00000000-0000-0000-0000-000000000002', ARRAY['influencer']),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002', 'Bob', 'Johnson', 'bob@globalind.com', '+1-555-0201',
     'Procurement Manager', 'new', '00000000-0000-0000-0000-000000000002', ARRAY['procurement']);

-- Create sample interactions
INSERT INTO interactions (id, tenant_id, customer_id, account_id, user_id, type, direction, status, subject, description, started_at, duration_seconds) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001', 'call', 'outbound', 'completed',
     'Initial Discovery Call', 'Discussed their current tech stack and pain points. Very interested in our solution.',
     CURRENT_TIMESTAMP - INTERVAL '7 days', 1800),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001', 'email', 'outbound', 'completed',
     'Follow-up: Product Demo', 'Sent detailed product information and scheduled demo for next week.',
     CURRENT_TIMESTAMP - INTERVAL '5 days', NULL),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002', 'meeting', 'outbound', 'completed',
     'Product Demo', 'Conducted full product demonstration. Team was impressed with the features.',
     CURRENT_TIMESTAMP - INTERVAL '2 days', 3600);

-- Create sample tasks
INSERT INTO tasks (id, tenant_id, title, description, status, priority, due_date, customer_id, assigned_to, created_by) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'Send proposal to Acme', 'Prepare and send pricing proposal based on demo feedback', 'pending', 'high',
     CURRENT_TIMESTAMP + INTERVAL '3 days', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'Follow up with Global Industries', 'Initial outreach to discuss their manufacturing needs', 'pending', 'medium',
     CURRENT_TIMESTAMP + INTERVAL '5 days', '00000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001');

