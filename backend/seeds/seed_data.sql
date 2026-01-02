-- 1. CLEANUP (Optional: Clears old data to prevent duplicates)
TRUNCATE TABLE tasks, projects, users, tenants CASCADE;

-- 2. CREATE SUPER ADMIN ACCOUNT
-- Note: Super Admin is not linked to any specific tenant (tenant_id is NULL if your schema allows, otherwise we create a 'System' tenant)
-- Assuming your schema requires a tenant_id for all users, we first create a "System Admin" tenant or handle it as NULL if modified.
-- Based on standard SaaS, we usually create a 'Platform' tenant for the Super Admin.

INSERT INTO tenants (id, name, subdomain, status, subscription_plan)
VALUES (
    gen_random_uuid(), 
    'System Admin', 
    'admin', 
    'active', 
    'enterprise'
);

-- Now insert the Super Admin User
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, terms_accepted)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE subdomain = 'admin'), -- Links to the System Tenant
    'superadmin@system.com',
    crypt('Admin@123', gen_salt('bf')), -- Hashes the password securely
    'Super Administrator',
    'super_admin',
    TRUE,
    TRUE
);

-- 3. CREATE SAMPLE TENANT (Demo Company)
INSERT INTO tenants (id, name, subdomain, status, subscription_plan)
VALUES (
    gen_random_uuid(), 
    'Demo Company', 
    'demo', 
    'active', 
    'pro'
);

-- 4. CREATE TENANT ADMIN FOR DEMO COMPANY
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, terms_accepted)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE subdomain = 'demo'),
    'admin@demo.com',
    crypt('Demo@123', gen_salt('bf')),
    'Demo Admin',
    'tenant_admin',
    TRUE,
    TRUE
);

-- 5. CREATE 2 REGULAR USERS FOR DEMO COMPANY
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, terms_accepted)
VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE subdomain = 'demo'),
    'user1@demo.com',
    crypt('User@123', gen_salt('bf')),
    'Demo User 1',
    'user',
    TRUE,
    TRUE
),
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE subdomain = 'demo'),
    'user2@demo.com',
    crypt('User@123', gen_salt('bf')),
    'Demo User 2',
    'user',
    TRUE,
    TRUE
);

-- 6. CREATE 2 SAMPLE PROJECTS
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE subdomain = 'demo'),
    'Website Redesign',
    'Overhauling the company website with React and Node.js',
    'active',
    (SELECT id FROM users WHERE email = 'admin@demo.com')
),
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE subdomain = 'demo'),
    'Mobile App Launch',
    'Launching the new iOS and Android apps',
    'active',
    (SELECT id FROM users WHERE email = 'admin@demo.com')
);

-- 7. CREATE 5 SAMPLE TASKS (Distributed across projects)
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES 
-- Task 1 for Website Redesign
(
    gen_random_uuid(),
    (SELECT id FROM projects WHERE name = 'Website Redesign'),
    (SELECT id FROM tenants WHERE subdomain = 'demo'),
    'Design Homepage Mockups',
    'Create Figma designs for the new homepage',
    'todo',
    'high',
    (SELECT id FROM users WHERE email = 'user1@demo.com'),
    NOW() + INTERVAL '3 days'
),
-- Task 2 for Website Redesign
(
    gen_random_uuid(),
    (SELECT id FROM projects WHERE name = 'Website Redesign'),
    (SELECT id FROM tenants WHERE subdomain = 'demo'),
    'Setup React Repo',
    'Initialize the frontend repository',
    'in_progress',
    'medium',
    (SELECT id FROM users WHERE email = 'user2@demo.com'),
    NOW() + INTERVAL '1 day'
),
-- Task 3 for Mobile App
(
    gen_random_uuid(),
    (SELECT id FROM projects WHERE name = 'Mobile App Launch'),
    (SELECT id FROM tenants WHERE subdomain = 'demo'),
    'Configure Push Notifications',
    'Setup Firebase for push notifications',
    'todo',
    'high',
    (SELECT id FROM users WHERE email = 'user1@demo.com'),
    NOW() + INTERVAL '5 days'
),
-- Task 4 for Mobile App
(
    gen_random_uuid(),
    (SELECT id FROM projects WHERE name = 'Mobile App Launch'),
    (SELECT id FROM tenants WHERE subdomain = 'demo'),
    'App Store Submission',
    'Prepare assets for Apple Store',
    'todo',
    'high',
    (SELECT id FROM users WHERE email = 'admin@demo.com'),
    NOW() + INTERVAL '10 days'
),
-- Task 5 for Website Redesign
(
    gen_random_uuid(),
    (SELECT id FROM projects WHERE name = 'Website Redesign'),
    (SELECT id FROM tenants WHERE subdomain = 'demo'),
    'Fix CSS Bugs',
    'Resolve mobile responsiveness issues',
    'completed',
    'low',
    (SELECT id FROM users WHERE email = 'user2@demo.com'),
    NOW() - INTERVAL '1 day'
);