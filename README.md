Multi-Tenant SaaS Task Manager
1. Project Description
This is a robust, production-ready Multi-Tenant SaaS platform designed for scalable project and task management. The application uses a shared-database architecture with logical data isolation to ensure each tenant's data remains private and secure.Target Audience: Small to medium-sized enterprises (SMEs) and project teams requiring a centralized, containerized solution for collaborative task tracking.

2. Features ListMulti-Tenancy: Isolated data environment for different organizations using subdomain-based routing.
Role-Based Access Control (RBAC): Distinct permissions for Super Admins, Tenant Admins, and Regular Users.
Automated Database Lifecycle: Self-executing schema migrations (001-006) and data seeding upon startup.
Project Management: Create, update, and archive projects specific to each tenant.
Task Tracking: Granular task management including status updates, priority levels, and assignments.
Security: Secure authentication using JSON Web Tokens (JWT) and encrypted password hashing.
Audit Logging: Automatic tracking of system actions for security auditing and compliance.
Health Monitoring: Integrated health checks to verify database and API readiness.

3. Technology StackFrontend: React (v18), Vite, Tailwind CSS.
Backend: Node.js (v18), Express.js framework.
Database: PostgreSQL (v15).
Containerization: Docker & Docker Compose.
4. Architecture Overview
The application follows a classic three-tier architecture fully encapsulated in Docker containers.
Presentation Layer: React frontend serves the UI and communicates with the API via Axios.
Logic Layer: Node.js/Express backend handles authentication, multi-tenancy logic, and business rules.
Data Layer: PostgreSQL stores all relational data, using a tenant_id column for logical data partitioning.

5. Installation & Setup
Follow these steps to get the environment running locally:
Prerequisites:
Docker Desktop installed and running.
Step-by-Step Setup:
Clone the Repository: git clone <your-repo-url>
cd project
Start the Environment:Run the following command to build and start all services:
docker-compose up -d --build
Check status with:Bashdocker-compose ps

6. Environment Variables
The following variables are configured in the docker-compose.yml for internal communication:VariablePurposeDB_HOSTHostname of the database service (set to database).
DB_PORTPort for PostgreSQL (default 5432).
JWT_SECRETKey used for signing and verifying authentication tokens.VITE_API_URLThe external URL the frontend uses to contact the API (http://localhost:5000/api).

7. API Documentation
The backend exposes the following primary endpoints:
System Health: GET /api/health — Returns 200 OK if the database is connected and ready.
Authentication: POST /api/auth/login — Validates credentials and returns a JWT.
Projects: GET /api/projects — Lists all projects belonging to the authenticated tenant.
Tasks: GET /api/tasks — Lists tasks within a specific project.