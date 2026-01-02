# Technical Specification

## Project: Multi-Tenant SaaS Task Management Platform

This document defines the technical implementation details of the system, including project structure and development setup guidelines. It serves as a reference for developers to understand code organization, configuration, and local execution procedures.
---

## 1. Project Structure

The project follows a **monorepo-style structure** with clear separation between backend and frontend concerns. This improves maintainability, scalability, and developer collaboration.

### 1.1 Backend Folder Structure

```
backend/
├── controllers/
├── middleware/
├── migrations/
├── seeds/
├── src/
├── db.js
├── db.ts
├── server.js
├── Dockerfile
├── package.json
├── package-lock.json
├── .env
├── .dockerignore
```

#### Folder & File Responsibilities

* **controllers/**
  Contains request-handling logic for API endpoints. Each controller corresponds to a module such as authentication, tenants, projects, or tasks.

* **middleware/**
  Includes reusable Express middleware such as JWT authentication, role-based authorization, request validation, and error handling.

* **migrations/**
  Database schema migration files used to create and update database structure in a version-controlled manner.

* **seeds/**
  Initial data used to bootstrap the system, including default roles, admin users, and system configurations.

* **src/**
  Core application logic and shared utilities. This directory helps separate framework-level code from business logic.

* **db.js / db.ts**
  Database configuration and connection logic for PostgreSQL. Supports both JavaScript and TypeScript usage.

* **server.js**
  Application entry point. Initializes Express server, middleware, routes, and database connections.

* **Dockerfile**
  Defines the backend service container configuration.

* **.env**
  Stores environment-specific configuration such as database credentials and JWT secrets.

---

### 1.2 Frontend Folder Structure

```
frontend/
├── src/
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── eslint.config.js
├── Dockerfile
├── .dockerignore
```

#### Folder & File Responsibilities

* **src/**
  Contains React components, pages, hooks, services, and state management logic.

* **index.html**
  Root HTML file that bootstraps the React application.

* **tailwind.config.js / postcss.config.js**
  Configuration files for Tailwind CSS and PostCSS styling pipeline.

* **tsconfig.app.json**
  TypeScript configuration for the frontend application.

* **eslint.config.js**
  Enforces code quality and consistency.

* **Dockerfile**
  Defines the frontend service container.

---

## 2. Development Setup Guide

### 2.1 Prerequisites

Ensure the following tools are installed:

* Node.js v18+
* npm v9+
* Docker Desktop
* PostgreSQL v15 (for non-Docker local runs)

---

### 2.2 Environment Variables

Backend environment variables (defined in `.env`):

* `DB_HOST`
* `DB_PORT`
* `DB_NAME`
* `DB_USER`
* `DB_PASSWORD`
* `JWT_SECRET`



---

### 2.3 Installation Steps

1. Clone the repository
2. Navigate to the project root directory
3. Install dependencies:

   ```bash
   npm install
   ```

---

### 2.4 Running the Application Locally

Using Docker (recommended):

```bash
docker-compose up -d --build
```

Verify running containers:

```bash
docker-compose ps
```

Access the application via browser:

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend API: [http://localhost:5000/api](http://localhost:5000/api)

---


## Conclusion

This technical specification provides a clear blueprint of the system’s internal structure and execution workflow. By following standardized folder organization and setup procedures, the platform ensures consistency, scalability, and ease of development across teams.
