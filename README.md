# PeoplePay360 — Enterprise HRMS & Payroll Management System

PeoplePay360 is an integrated, production-grade enterprise Human Resource and Payroll platform built with a **Modular Monolith** architecture:

```
Employee → Employment Contract → Working Schedule → Attendance → Leave → Salary Structure → Salary Rules → Payroll Calculation → Payrun → Payslip
```

---

## 🏗️ Technology Stack (Specification & Architecture)

| Layer | Technology | Purpose | Implementation Details |
| :--- | :--- | :--- | :--- |
| **Frontend** | React + TypeScript | User interface | Modern responsive UI (`frontend/`) |
| **Styling** | Tailwind CSS | Responsive UI | Utility-first styling (`frontend/src/index.css`) |
| **UI Components** | Shadcn/UI | Reusable components | Accessible, modern component system |
| **State Management** | Zustand / Redux Toolkit | Global frontend state | State store architecture |
| **API Fetching** | TanStack Query | API caching & server state | Asynchronous query caching & optimistic updates |
| **Backend Runtime** | Node.js | Server runtime | Node.js (v20+) runtime engine |
| **Backend Language** | TypeScript | Type safety & maintainability | Strict type safety with `tsconfig.json` |
| **Backend Framework** | Express.js | REST API development | Robust HTTP routing, middleware, CORS, and Helmet |
| **Database** | PostgreSQL | Main relational database | PostgreSQL relational database (`prisma/schema.prisma`) |
| **ORM** | Prisma | Database access & migrations | Type-safe queries, relational schema migrations & seeding |
| **Authentication** | JWT | User authentication | Access & rotating refresh tokens (`auth.service.ts`) |
| **Password Hashing** | Argon2 | Secure password storage | Argon2id high-entropy password hashing (`auth.service.ts`) |
| **Authorization** | RBAC + Permissions | Role-based access control | Role & granular permission guards (`shared/guards/`) |
| **Validation** | Zod | Request & data validation | Schema-based payload validation on all endpoints |
| **Cache** | Redis | Fast caching | High-performance memory cache client (`config/redis.ts`) |
| **Background Jobs** | BullMQ | Payroll & email processing | Robust Redis-backed distributed task queue (`modules/jobs/`) |
| **Queue Storage** | Redis | Job queue backend | Persistence backend for BullMQ job queue |
| **PDF Generation** | PDFKit / Puppeteer | Payslip PDF generation | High-resolution streaming payslip rendering (`payslips/`) |
| **Email** | Nodemailer | Payslip emails & notifications | SMTP transport and email delivery (`shared/utils/email.service.ts`) |
| **File Storage** | Local/S3-compatible abstraction | Payslip & document storage | Pluggable local disk & S3 object storage (`shared/utils/storage.service.ts`) |
| **Logging** | Pino | Structured backend logging | High-speed JSON structured logger with correlation IDs (`config/logger.ts`) |
| **API Documentation** | Swagger / OpenAPI | API documentation | Interactive Swagger UI at `/api/docs` and `/api/v1/docs` (`config/swagger.ts`) |
| **API Testing** | Postman | Manual API testing | Postman collection ready to import (`PeoplePay360.postman_collection.json`) |
| **Unit Testing** | Vitest | Business logic testing | Unit test suite for salary rule evaluator & domain logic (`vitest.config.ts`) |
| **Integration Testing**| Supertest | API testing | HTTP integration test suite (`src/__tests__/api.integration.spec.ts`) |
| **Containerization** | Docker | Consistent deployment | Multi-stage production `Dockerfile` (`backend/Dockerfile`) |
| **Orchestration (Local)**| Docker Compose | Run API + DB + Redis | Complete local composition (`docker-compose.yml`) |
| **Version Control** | Git + GitHub | Team collaboration | GitHub repository at `https://github.com/TinaKhatri28/PeoplePay360` |
| **CI/CD** | GitHub Actions | Automated testing/build | CI pipeline running lint, build & tests (`.github/workflows/ci.yml`) |
| **Monitoring** | Health checks + structured logs | Application monitoring | Health endpoints (`/api/health`, `/api/v1/health`) + Pino logs |

---

## 🚀 Quick Start (Local Development)

### 1. Backend

```bash
cd backend
npm install
npm run prisma:generate # Generates Prisma Client
npm run prisma:push     # Pushes schema to PostgreSQL
npm run seed            # Seeds organization, employees, contracts, rules, payruns
npm test                # Runs Vitest unit & Supertest integration test suite
npm run dev             # Starts development server on http://localhost:4000
```

### 2. Interactive Swagger Documentation

Open your browser to:
- **Swagger UI**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Detailed Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

## 🔑 Demo Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@oxp.com` | `admin123` | Full enterprise administrative & payroll control |
| **Payroll Specialist** | `aarav@oxp.com` | `payroll123` | Payrun computation, contracts, attendance & payslips |
| **Employee** | `john@oxp.com` | `employee123` | Self-service check-in/out, leave requests & payslips |

---

## 🐳 Docker Compose Deployment

Run the complete stack (PostgreSQL 16 + Redis 7 + Express Backend API):

```bash
docker-compose up --build
```

---

## 🧪 Automated Testing

```bash
cd backend
npm test
```
- **Unit tests**: Evaluates standard salary rules, fixed calculations, percentage sequences, and formula-based rules.
- **Integration tests**: Boots the Express application, verifies `/api/health`, `/api/docs`, authentication failures (401), and successful admin JWT issuance.

---

## 📬 Postman Collection

Import `PeoplePay360.postman_collection.json` into Postman. It includes pre-configured requests for Authentication, Employees, Contracts, Attendance, Leaves, Payruns, Payslips, and Executive Dashboards with automatic JWT token capture.
