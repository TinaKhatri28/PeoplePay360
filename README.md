# PeoplePay360 — HR + Payroll App

## What's in this zip

- `backend/` — **Fully working and tested** Node.js + Express + SQLite (better-sqlite3) API.
  Covers: auth (JWT + roles), employees, contracts (with running-contract rule),
  working schedules, attendance (check-in/out + worked hours), time off
  (types/allocations/requests with real balance updates), salary structures/rules
  (FIXED / PERCENTAGE / FORMULA engine), full payrun lifecycle (create → compute →
  validate → mark paid → send), PDF payslip generation, and a live dashboard.
- `frontend/` — Vite + React scaffold only (not yet built out with the actual screens).

## Run the backend (this part works end-to-end right now)

```bash
cd backend
npm install
npm run seed     # populates demo data: employees, contracts, attendance, salary rules, a paid Aug payrun etc.
npm start        # starts the API on http://localhost:4000
```

Demo logins (created by the seed script):

| Role          | Email             | Password    |
|---------------|-------------------|-------------|
| Admin         | admin@oxp.com     | admin123    |
| Payroll User  | aarav@oxp.com     | payroll123  |
| Employee      | john@oxp.com      | employee123 |

Quick sanity check:

```bash
curl http://localhost:4000/api/health
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@oxp.com","password":"admin123"}'
```

Then use the token from the response as `Authorization: Bearer <token>` on any other
`/api/...` route (see `backend/src/routes/` for the full list — employees, contracts,
attendance, time-off, schedules, salary, payroll, dashboard).

## Try the full payroll flow with curl

```bash
TOKEN=... # from login above

# 1. See who's eligible for a September 2026 payrun
curl "http://localhost:4000/api/payroll/eligible-employees?year=2026&month=9" -H "Authorization: Bearer $TOKEN"

# 2. Create the payrun with selected employee ids
curl -X POST http://localhost:4000/api/payroll/payruns -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"period_month":9,"period_year":2026,"structure_id":1,"employee_ids":[1,2,3,4,5,6]}'

# 3. Compute -> validate -> mark paid -> send (replace :id)
curl -X POST http://localhost:4000/api/payroll/payruns/:id/compute -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:4000/api/payroll/payruns/:id/validate -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:4000/api/payroll/payruns/:id/mark-paid -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:4000/api/payroll/payruns/:id/send-payslips -H "Authorization: Bearer $TOKEN"

# 4. Dashboard
curl "http://localhost:4000/api/dashboard?year=2026&month=9" -H "Authorization: Bearer $TOKEN"
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

This currently boots the default Vite/React starter page only — the actual
PeoplePay360 screens (login, employee kanban/list/form, contracts, attendance
widget, time off, payroll, dashboard with charts) still need to be built on top
of it and wired to the backend API above.

## Notes on data layer

The build originally targeted PostgreSQL + Prisma, but Prisma's query-engine
binary download was blocked on this sandbox's network, so the data layer uses
**better-sqlite3** instead — same Node/Express/JWT stack, but zero external DB
server to install, which is actually safer for a hackathon on unfamiliar venue wifi.
The database file lives at `backend/data/peoplepay360.db` and is recreated by
`npm run seed`.
