const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'peoplepay360.db');

let db;
try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.pragma = (str) => db.exec(`PRAGMA ${str};`);
} catch (e) {
  const Database = require('better-sqlite3');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}

db.exec(`
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  position TEXT,
  department_id INTEGER REFERENCES departments(id),
  manager_id INTEGER REFERENCES employees(id),
  schedule_id INTEGER REFERENCES working_schedules(id),
  company TEXT DEFAULT 'OXP Pvt Ltd',
  work_location TEXT,
  bank_account TEXT,
  status TEXT DEFAULT 'Active',
  avatar_initials TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS working_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT DEFAULT 'My Company',
  days_per_week INTEGER,
  schedule_json TEXT -- JSON array of {day, start, end, breakHours}
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER REFERENCES employees(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  roles TEXT NOT NULL, -- comma separated: Employee,HR Manager,HR Payroll User,HR Payroll Admin
  status TEXT DEFAULT 'Active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT UNIQUE,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  start_date TEXT NOT NULL,
  end_date TEXT,
  wage REAL NOT NULL,
  status TEXT DEFAULT 'Running', -- Running / Expired / Draft
  department TEXT,
  position TEXT,
  schedule_id INTEGER REFERENCES working_schedules(id),
  salary_structure_id INTEGER REFERENCES salary_structures(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  worked_hours REAL DEFAULT 0,
  overtime_hours REAL DEFAULT 0,
  status TEXT DEFAULT 'Present', -- Present / Absent / Late
  notes TEXT
);

CREATE TABLE IF NOT EXISTS time_off_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unit TEXT DEFAULT 'Days', -- Days / Hours
  allocation_required INTEGER DEFAULT 1,
  approval_role TEXT DEFAULT 'Manager'
);

CREATE TABLE IF NOT EXISTS time_off_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  type_id INTEGER NOT NULL REFERENCES time_off_types(id),
  allocated REAL NOT NULL,
  taken REAL DEFAULT 0,
  status TEXT DEFAULT 'Approved',
  approver_id INTEGER REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS time_off_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  type_id INTEGER NOT NULL REFERENCES time_off_types(id),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  duration REAL NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'To Approve', -- To Approve / Approved / Refused
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_structures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS salary_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  structure_id INTEGER NOT NULL REFERENCES salary_structures(id),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Allowance', -- Basic / Allowance / Deduction
  compute_method TEXT NOT NULL, -- FIXED / PERCENTAGE / FORMULA
  amount REAL, -- for FIXED
  percentage REAL, -- for PERCENTAGE
  percentage_of TEXT, -- 'BASIC' etc
  formula_key TEXT, -- for FORMULA: 'OVERTIME' / 'UNPAID_LEAVE_DEDUCTION'
  sequence INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS payruns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  structure_id INTEGER REFERENCES salary_structures(id),
  company TEXT DEFAULT 'OXP Pvt Ltd',
  status TEXT DEFAULT 'Draft', -- Draft / Computed / Validated / Paid
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payslips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payrun_id INTEGER NOT NULL REFERENCES payruns(id),
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  contract_id INTEGER REFERENCES contracts(id),
  gross REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  net REAL DEFAULT 0,
  lines_json TEXT, -- JSON array of {name, category, amount}
  status TEXT DEFAULT 'Draft', -- Draft / Done / Paid
  sent INTEGER DEFAULT 0,
  warnings_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
