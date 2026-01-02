-- UP MIGRATION
CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'completed');
CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high');

CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    status          task_status_enum DEFAULT 'todo',
    priority        task_priority_enum DEFAULT 'medium',
    assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date        DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
