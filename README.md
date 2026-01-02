# Multi-Tenant SaaS Task Management Platform

## 📌 Project Description

The **Multi-Tenant SaaS Task Management Platform** is a production-ready, multi-tenant environment. The system supports multiple organizations (tenants) on a shared infrastructure while ensuring strict data isolation and role-based access control.

This platform is ideal for **startups, small-to-medium enterprises, and internal teams** looking for a scalable task and project management solution built with modern web technologies.

---

## 🚀 Features

* Multi-Tenant Architecture with strict tenant data isolation
* Subdomain-based tenant routing
* Role-Based Access Control (Super Admin, Tenant Admin, End User)
* Secure authentication using JWT
* Project creation, update, and archival
* Task management with status, priority, and assignments
* Subscription and user limit enforcement per tenant
* Automated database migrations and seeding
* Audit logging for critical system actions
* Health check endpoint for system monitoring

---

## 🛠 Technology Stack

### Frontend

* React v18
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL v15

### Containerization & DevOps

* Docker
* Docker Compose

---

## 🏗 Architecture Overview

The application follows a **three-tier architecture** and is fully containerized using Docker:

* **Client Layer:** Web browser accessing the React frontend
* **Application Layer:** Node.js + Express REST API handling authentication, business logic, and multi-tenancy
* **Data Layer:** PostgreSQL database with logical tenant isolation using `tenant_id`

Authentication is handled using JWT tokens, and all protected routes enforce role-based authorization.

📷 **Architecture Diagram:**
`docs/images/system-architecture.png`
`docs/images/database-erd.png`

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js v18+
* npm v9+
* Docker Desktop

---

### Step-by-Step Setup (Using Docker)

1. Clone the repository:

   ```bash
   git clone https://github.com/sai1432-ss/SaaSApplication.git
   cd SaaSApplication
   ```

2. Build and start all services:

   ```bash
   docker-compose up -d --build
   ```

3. Verify running containers:

   ```bash
   docker-compose ps
   ```

---

### Database Migrations & Seeding

Migrations and seed scripts run automatically when the backend container starts. No manual execution is required.

---

### Running Services

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend API: [http://localhost:5000/api](http://localhost:5000/api)
* Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔐 Environment Variables

### Backend (`.env`)

| Variable    | Description                     |
| ----------- | ------------------------------- |
| DB_HOST     | Database service hostname       |
| DB_PORT     | PostgreSQL port (default: 5432) |
| DB_NAME     | Database name                   |
| DB_USER     | Database username               |
| DB_PASSWORD | Database password               |
| JWT_SECRET  | Secret key for JWT signing      |

### Frontend

| Variable     | Description          |
| ------------ | -------------------- |
| VITE_API_URL | Backend API base URL |

---

## 📡 API Documentation

Detailed API documentation is available in:

📄 `docs/API.md`

### Key Endpoints (Overview)

* `POST /api/auth/register-tenant`
* `POST /api/auth/login`
* `GET /api/tenants`
* `GET /api/projects`
* `POST /api/projects`
* `GET /api/tasks`

All protected endpoints require a valid JWT token in the Authorization header.

---

## 📘 Additional Documentation

* Research & System Design: `docs/research.md`
* Product Requirements Document: `docs/PRD.md`
* Architecture Design: `docs/architecture.md`
* Technical Specification: `docs/technical-spec.md`

---

## ✅ Conclusion

This project demonstrates a complete end-to-end implementation of a scalable, secure, and maintainable multi-tenant SaaS platform. It follows industry best practices in system design, security, and DevOps, making it suitable for academic evaluation as well as real-world applications.
