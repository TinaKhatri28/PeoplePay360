import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let db: any;

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  // Synchronous query helper wrapper via child_process
  const syncExec = (sql: string, params: any[] = []) => {
    const res = require('child_process').spawnSync('node', [
      '-e',
      `
      const { Client } = require('pg');
      const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      client.connect().then(() => client.query(process.argv[1], JSON.parse(process.argv[2]))).then(res => {
        const r = Array.isArray(res) ? (res.find(x => x && x.rows && x.rows.length) || res[res.length - 1]) : res;
        const rows = r?.rows || [];
        const rowCount = r?.rowCount || 0;
        const lastInsertRowid = rows[0]?.id || null;
        console.log(JSON.stringify({ rows, rowCount, lastInsertRowid }));
        client.end();
      }).catch(e => {
        console.error(e);
        process.exit(1);
      });
      `,
      sql,
      JSON.stringify(params)
    ], { env: process.env, encoding: 'utf-8' });

    if (res.status !== 0) {
      throw new Error(res.stderr || 'Database query failed');
    }
    return JSON.parse(res.stdout || '{}');
  };

  // Helper to convert SQLite ? to PostgreSQL $1, $2...
  const convertSql = (sql: string): string => {
    let paramIndex = 1;
    let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    pgSql = pgSql.replace(/LIKE/gi, 'ILIKE');
    return pgSql;
  };

  const convertRow = (row: any) => {
    if (!row) return row;
    const out: any = {};
    for (const key of Object.keys(row)) {
      let val = row[key];
      if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '' && !key.includes('date') && !key.includes('at') && !key.includes('ref') && !key.includes('email') && !key.includes('phone') && !key.includes('account')) {
        if (key.includes('gross') || key.includes('net') || key.includes('deduction') || key.includes('wage') || key.includes('amount') || key.includes('percentage') || key.includes('worked') || key.includes('overtime') || key.includes('allocated') || key.includes('taken') || key.includes('duration')) {
          val = Number(val);
        }
      }
      out[key] = val;
    }
    return out;
  };

  // Ensure PostgreSQL tables exist synchronously
  try {
    syncExec(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS working_schedules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) DEFAULT 'My Company',
        days_per_week INTEGER,
        schedule_json TEXT
      );

      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(255),
        position VARCHAR(255),
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        schedule_id INTEGER REFERENCES working_schedules(id) ON DELETE SET NULL,
        company VARCHAR(255) DEFAULT 'OXP Pvt Ltd',
        work_location VARCHAR(255),
        bank_account VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Active',
        avatar_initials VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        roles TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS salary_structures (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        ref VARCHAR(255) UNIQUE,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        start_date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50),
        wage NUMERIC(12,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Running',
        department VARCHAR(255),
        position VARCHAR(255),
        schedule_id INTEGER REFERENCES working_schedules(id) ON DELETE SET NULL,
        salary_structure_id INTEGER REFERENCES salary_structures(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date VARCHAR(50) NOT NULL,
        check_in TEXT,
        check_out TEXT,
        worked_hours NUMERIC(6,2) DEFAULT 0,
        overtime_hours NUMERIC(6,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Present',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS time_off_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(50) DEFAULT 'Days',
        allocation_required INTEGER DEFAULT 1,
        approval_role VARCHAR(100) DEFAULT 'Manager'
      );

      CREATE TABLE IF NOT EXISTS time_off_allocations (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        type_id INTEGER NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
        allocated NUMERIC(6,2) NOT NULL,
        taken NUMERIC(6,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Approved',
        approver_id INTEGER REFERENCES employees(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS time_off_requests (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        type_id INTEGER NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
        start_date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50) NOT NULL,
        duration NUMERIC(6,2) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'To Approve',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS salary_rules (
        id SERIAL PRIMARY KEY,
        structure_id INTEGER NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) DEFAULT 'Allowance',
        compute_method VARCHAR(50) NOT NULL,
        amount NUMERIC(12,2),
        percentage NUMERIC(6,2),
        percentage_of VARCHAR(100),
        formula_key VARCHAR(100),
        sequence INTEGER DEFAULT 10
      );

      CREATE TABLE IF NOT EXISTS payruns (
        id SERIAL PRIMARY KEY,
        period_month INTEGER NOT NULL,
        period_year INTEGER NOT NULL,
        structure_id INTEGER REFERENCES salary_structures(id) ON DELETE SET NULL,
        company VARCHAR(255) DEFAULT 'OXP Pvt Ltd',
        status VARCHAR(50) DEFAULT 'Draft',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payslips (
        id SERIAL PRIMARY KEY,
        payrun_id INTEGER NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
        gross NUMERIC(12,2) DEFAULT 0,
        deductions NUMERIC(12,2) DEFAULT 0,
        net NUMERIC(12,2) DEFAULT 0,
        lines_json TEXT,
        status VARCHAR(50) DEFAULT 'Draft',
        sent INTEGER DEFAULT 0,
        warnings_json TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PostgreSQL (Neon) Database connected & schema verified.');
  } catch (err) {
    console.error('PostgreSQL init error:', err);
  }

  db = {
    pragma: (_str: string) => {},
    prepare: (sql: string) => {
      let pgSql = convertSql(sql);
      const isInsert = /^\s*INSERT\s+INTO/i.test(sql);
      if (isInsert && !/RETURNING/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }

      return {
        get: (...params: any[]) => {
          const flatParams = params.flat();
          const result = syncExec(pgSql, flatParams);
          return convertRow(result.rows?.[0] || null);
        },
        all: (...params: any[]) => {
          const flatParams = params.flat();
          const result = syncExec(pgSql, flatParams);
          return (result.rows || []).map(convertRow);
        },
        run: (...params: any[]) => {
          if (/DELETE\s+FROM/i.test(sql)) {
            // handle DELETE
            const result = syncExec(pgSql, params.flat());
            return { changes: result.rowCount || 0 };
          }
          const flatParams = params.flat();
          const result = syncExec(pgSql, flatParams);
          const lastId = result.rows?.[0]?.id || result.lastInsertRowid || 0;
          return { lastInsertRowid: lastId, changes: result.rowCount || 0 };
        }
      };
    }
  };
} else {
  // SQLite Fallback
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'peoplepay360.db');

  try {
    const { DatabaseSync } = require('node:sqlite');
    db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    db.pragma = (str: string) => db.exec(`PRAGMA ${str};`);
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
      schedule_json TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER REFERENCES employees(id),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      roles TEXT NOT NULL,
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
      status TEXT DEFAULT 'Running',
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
      status TEXT DEFAULT 'Present',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS time_off_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit TEXT DEFAULT 'Days',
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
      status TEXT DEFAULT 'To Approve',
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
      category TEXT DEFAULT 'Allowance',
      compute_method TEXT NOT NULL,
      amount REAL,
      percentage REAL,
      percentage_of TEXT,
      formula_key TEXT,
      sequence INTEGER DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS payruns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_month INTEGER NOT NULL,
      period_year INTEGER NOT NULL,
      structure_id INTEGER REFERENCES salary_structures(id),
      company TEXT DEFAULT 'OXP Pvt Ltd',
      status TEXT DEFAULT 'Draft',
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
      lines_json TEXT,
      status TEXT DEFAULT 'Draft',
      sent INTEGER DEFAULT 0,
      warnings_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export default db;
export { db };
