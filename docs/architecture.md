# System Architecture Design

## Project: Multi-Tenant SaaS Task Management Platform

This document describes the overall system architecture, database schema design, and API architecture of the Multi-Tenant SaaS Task Management Platform. It provides a clear structural view of how different components interact and how data flows securely across the system.
---

## 1. System Architecture Diagram

### 1.1 High-Level Architecture Overview

The system follows a **three-tier architecture** pattern designed for scalability, maintainability, and security. All components are containerized using Docker.

**Components:**

* Client (Web Browser)
* Frontend Application (React)
* Backend API Server (Node.js + Express)
* Database (PostgreSQL)

### 1.2 Authentication & Request Flow

1. The client accesses the application via a web browser.
2. The frontend application (React) loads and interacts with users.
3. For protected actions, the frontend sends API requests to the backend with a JWT token in the Authorization header.
4. The backend validates the JWT, extracts userId, tenantId, and role.
5. Authorized requests are processed and scoped using tenantId.
6. The backend interacts with PostgreSQL to fetch or persist data.
7. The response is sent back to the frontend.

**Authentication Flow:**

* User submits login credentials
* Backend validates credentials
* JWT is issued and stored on the client
* JWT is attached to all subsequent API requests

**Diagram Storage:**
The system architecture diagram is saved as:
`docs/images/system-architecture.png`

---

## 2. Database Schema Design

### 2.1 Entity Relationship Diagram (ERD)

The database uses a **shared-schema multi-tenant design**, where tenant-specific data is logically isolated using a `tenant_id` column.

### 2.2 Core Tables & Relationships

**Tenants**

* id (PK)
* name
* subdomain (unique)
* status
* subscriptionPlan
* created_at

**Users**

* id (PK)
* tenant_id (FK → tenants.id)
* email (unique per tenant)
* password_hash
* role
* status

**Projects**

* id (PK)
* tenant_id (FK → tenants.id)
* name
* created_by (FK → users.id)
* status

**Tasks**

* id (PK)
* tenant_id (FK → tenants.id)
* project_id (FK → projects.id)
* assigned_to (FK → users.id)
* status
* priority

### 2.3 Keys, Indexes & Isolation

* All tenant-specific tables include a mandatory `tenant_id`
* Foreign keys enforce referential integrity
* Indexes applied on `tenant_id`, `email`, and `project_id`
* Queries are always scoped using `tenant_id`

**ERD Storage:**
The database ER diagram is saved as:
`docs/images/database-erd.png`

---

## 3. API Architecture

### 3.1 API Organization

APIs are organized into logical modules:

* Authentication
* Tenants
* Users
* Projects
* Tasks

### 3.2 API Endpoints

#### Authentication Module

* POST /api/auth/register-tenant (Public)
* POST /api/auth/login (Public)

#### Tenant Module

* GET /api/tenants (Auth: Super Admin)
* GET /api/tenants/:tenantId (Auth: Super Admin)
* PUT /api/tenants/:tenantId (Auth: Super Admin)

#### User Module

* POST /api/tenants/:tenantId/users (Auth: Tenant Admin)
* GET /api/tenants/:tenantId/users (Auth: Tenant Admin)
* PUT /api/users/:userId (Auth: Tenant Admin / User)
* DELETE /api/users/:userId (Auth: Tenant Admin)

#### Project Module

* POST /api/projects (Auth: Tenant Admin / User)
* GET /api/projects (Auth: Tenant Admin / User)
* GET /api/projects/:projectId (Auth: Tenant Admin / User)
* PUT /api/projects/:projectId (Auth: Tenant Admin)
* DELETE /api/projects/:projectId (Auth: Tenant Admin)

#### Task Module

* POST /api/projects/:projectId/tasks (Auth: Tenant Admin / User)
* GET /api/projects/:projectId/tasks (Auth: Tenant Admin / User)
* GET /api/tasks/:taskId (Auth: Tenant Admin / User)
* PATCH /api/tasks/:taskId (Auth: Tenant Admin / User)
* PUT /api/tasks/:taskId (Auth: Tenant Admin)

### 3.3 Security Enforcement

* JWT authentication required for all protected endpoints
* Role-based middleware enforces access control
* Tenant context extracted from JWT

---

## Conclusion

This architecture ensures strong tenant isolation, modular API design, and scalable system behavior. The layered approach enables future expansion while maintaining security and performance standards expected from a production-grade SaaS platform.
