API Documentation: Multi-Tenant SaaS Platform
1. Authentication & Global Security
All protected endpoints require a JWT Bearer Token in the Authorization header.

Header: Authorization: Bearer <your_jwt_token>

Token Expiry: 24 hours.

2. System Health
API 0: System Health Check
Endpoint: GET /api/health

Response (200): {"status": "ok", "database": "connected"}

Business Logic: Only returns 200 after database connectivity, migrations, and seeds are complete.

3. Authentication APIs
API 1: Tenant Registration
Endpoint: POST /api/auth/register-tenant

Body: tenantName, subdomain, adminEmail, adminPassword, adminFullName.

Logic: Uses a single transaction to create a tenant record and its initial tenant_admin user.

API 2: User Login
Endpoint: POST /api/auth/login

Body: email, password, tenantSubdomain.

Logic: Verifies tenant active status and user membership before issuing a 24-hour JWT containing userId, tenantId, and role.

4. Tenant Management (Admin)
API 3: List All Tenants
Endpoint: GET /api/tenants

Authorization: super_admin ONLY.

Features: Supports pagination and filtering by status or subscriptionPlan.

API 4: Get Tenant Details
Endpoint: GET /api/tenants/:tenantId

Logic: Returns full details plus aggregate stats (totalUsers, totalProjects, totalTasks).

API 5: Update Tenant
Endpoint: PUT /api/tenants/:tenantId

Logic: Allows updating name; sensitive fields (subscriptionPlan, maxUsers) are restricted to super_admin.

5. User Management
API 6: Add User to Tenant
Endpoint: POST /api/tenants/:tenantId/users

Logic: Checks current user count against tenant's maxUsers limit.

API 7: List Tenant Users
Endpoint: GET /api/tenants/:tenantId/users


API 8: Update User
Endpoint: PUT /api/users/:userId

Logic: tenant_admin can update role and status; regular users can only update their fullName.

API 9: Delete User
Endpoint: DELETE /api/users/:userId

Logic: Prevents tenant_admin from deleting themselves; cascades deletions or nullifies task assignments.

6. Project Management
API 10: Create Project
Endpoint: POST /api/projects

Logic: Automatically assigns tenantId and createdBy from the user's JWT.

API 11: List Projects
Endpoint: GET /api/projects

Features: Supports search by name (case-insensitive) and filtering by status.

API 12: Get Project Details
Endpoint: GET /api/projects/:projectId

API 13: Update Project
Endpoint: PUT /api/projects/:projectId

Authorization: tenant_admin or the original project creator.

API 14: Delete Project
Endpoint: DELETE /api/projects/:projectId

7. Task Management
API 15: Create Task
Endpoint: POST /api/projects/:projectId/tasks

Logic: Verifies the project belongs to the user's tenant before creation.

API 16: List Project Tasks
Endpoint: GET /api/projects/:projectId/tasks

Query Params: status filter.

API 17: Get Task Details
Endpoint: GET /api/tasks/:taskId

API 18: Update Task Status
Endpoint: Patch  /api/tasks/:taskId

Logic: Update status, priority, or assignee (assignee must belong to the same tenant).

API 19: Update Task
Endpoint: Put /api/tasks/:taskId
