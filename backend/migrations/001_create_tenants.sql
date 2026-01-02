-- UP MIGRATION
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE tenant_status_enum AS ENUM ('active', 'suspended', 'trial');
CREATE TYPE subscription_plan_enum AS ENUM ('free', 'pro', 'enterprise');

CREATE TABLE tenants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    subdomain           VARCHAR(255) NOT NULL UNIQUE,
    status              tenant_status_enum DEFAULT 'active',
    subscription_plan   subscription_plan_enum DEFAULT 'free',
    max_users           INTEGER DEFAULT 5,
    max_projects        INTEGER DEFAULT 3,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

