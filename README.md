# PeoplePay360 — Enterprise HRMS & Payroll Management System

PeoplePay360 is an integrated, production-grade enterprise Human Resource and Payroll platform built with a **Modular Monolith** architecture:

```
Employee → Employment Contract → Working Schedule → Attendance → Leave → Salary Structure → Salary Rules → Payroll Engine → Payrun → Payslip
```

---

## 🏗️ Architecture Stack

- **Runtime & Language**: Node.js (v20+) with Strict **TypeScript**
- **Framework**: Express.js with Helmet & CORS
- **Database & ORM**: **Prisma ORM** (PostgreSQL / SQLite dual-ready)
- **Validation**: **Zod** request & data validation schemas
- **Authentication & Security**: **Argon2** / bcrypt, JWT access & rotating refresh tokens, RBAC guards
- **Payroll Engine**: Pure domain service with safe non-eval formula engine & contract overlap protection
- **Background Jobs**: **BullMQ** with Redis connection and resilient in-process async execution fallback
- **Payslip Generation**: **PDFKit** high-resolution streaming
- **Logging**: **Pino** structured logging with correlation request IDs
- **Containerization**: **Docker** multi-stage build & `docker-compose.yml` (Postgres, Redis, API)

---

## 🚀 Quick Start (Local)

### 1. Backend

```bash
cd backend
npm install
npm run seed     # seeds demo organization, employees, contracts, attendance, salary rules, historical payruns
npm run dev      # starts development server on http://localhost:4000
# or
npm run build    # compiles TypeScript to dist/
npm start        # runs production dist/server.js
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # boots Vite dev server on http://localhost:5173 (proxies /api to backend)
```

---

## 🔑 Demo Logins

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@oxp.com` | `admin123` | Full enterprise administrative & payroll control |
| **Payroll Specialist** | `aarav@oxp.com` | `payroll123` | Payrun execution, contract viewing, payslips |
| **Employee** | `john@oxp.com` | `employee123` | Self-service check-in/out, leave requests, payslips |

---

## 🧪 Verification & Health Check

```bash
# Check API Health
curl http://localhost:4000/api/health

# Login as Admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@oxp.com","password":"admin123"}'
```

---

## 🐳 Docker Deployment

```bash
cd backend
docker compose up --build
```
This spins up PostgreSQL 16, Redis 7, and the compiled PeoplePay360 backend container.
