import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

async function seed() {
  console.log('Seeding PeoplePay360 demo data...');
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    const { Client } = require('pg');
    const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    console.log('Cleaning existing PostgreSQL tables...');
    await client.query(`DROP TABLE IF EXISTS payslips, payruns, salary_rules, salary_structures, time_off_requests, time_off_allocations, time_off_types, attendance, contracts, users, employees, working_schedules, departments CASCADE;`);

    console.log('Creating PostgreSQL schema...');
    await client.query(`
      CREATE TABLE departments (id SERIAL PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL);
      CREATE TABLE working_schedules (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, company VARCHAR(255) DEFAULT 'My Company', days_per_week INTEGER, schedule_json TEXT);
      CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, phone VARCHAR(255), position VARCHAR(255), department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL, manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL, schedule_id INTEGER REFERENCES working_schedules(id) ON DELETE SET NULL, company VARCHAR(255) DEFAULT 'OXP Pvt Ltd', work_location VARCHAR(255), bank_account VARCHAR(255), status VARCHAR(50) DEFAULT 'Active', avatar_initials VARCHAR(10), created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE users (id SERIAL PRIMARY KEY, employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash TEXT NOT NULL, roles TEXT NOT NULL, status VARCHAR(50) DEFAULT 'Active', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE salary_structures (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL);
      CREATE TABLE contracts (id SERIAL PRIMARY KEY, ref VARCHAR(255) UNIQUE, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, start_date VARCHAR(50) NOT NULL, end_date VARCHAR(50), wage NUMERIC(12,2) NOT NULL, status VARCHAR(50) DEFAULT 'Running', department VARCHAR(255), position VARCHAR(255), schedule_id INTEGER REFERENCES working_schedules(id) ON DELETE SET NULL, salary_structure_id INTEGER REFERENCES salary_structures(id) ON DELETE SET NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE attendance (id SERIAL PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, date VARCHAR(50) NOT NULL, check_in TEXT, check_out TEXT, worked_hours NUMERIC(6,2) DEFAULT 0, overtime_hours NUMERIC(6,2) DEFAULT 0, status VARCHAR(50) DEFAULT 'Present', notes TEXT);
      CREATE TABLE time_off_types (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, unit VARCHAR(50) DEFAULT 'Days', allocation_required INTEGER DEFAULT 1, approval_role VARCHAR(100) DEFAULT 'Manager');
      CREATE TABLE time_off_allocations (id SERIAL PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, type_id INTEGER NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE, allocated NUMERIC(6,2) NOT NULL, taken NUMERIC(6,2) DEFAULT 0, status VARCHAR(50) DEFAULT 'Approved', approver_id INTEGER REFERENCES employees(id) ON DELETE SET NULL);
      CREATE TABLE time_off_requests (id SERIAL PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, type_id INTEGER NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE, start_date VARCHAR(50) NOT NULL, end_date VARCHAR(50) NOT NULL, duration NUMERIC(6,2) NOT NULL, reason TEXT, status VARCHAR(50) DEFAULT 'To Approve', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE salary_rules (id SERIAL PRIMARY KEY, structure_id INTEGER NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE, name VARCHAR(255) NOT NULL, category VARCHAR(50) DEFAULT 'Allowance', compute_method VARCHAR(50) NOT NULL, amount NUMERIC(12,2), percentage NUMERIC(6,2), percentage_of VARCHAR(100), formula_key VARCHAR(100), sequence INTEGER DEFAULT 10);
      CREATE TABLE payruns (id SERIAL PRIMARY KEY, period_month INTEGER NOT NULL, period_year INTEGER NOT NULL, structure_id INTEGER REFERENCES salary_structures(id) ON DELETE SET NULL, company VARCHAR(255) DEFAULT 'OXP Pvt Ltd', status VARCHAR(50) DEFAULT 'Draft', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE payslips (id SERIAL PRIMARY KEY, payrun_id INTEGER NOT NULL REFERENCES payruns(id) ON DELETE CASCADE, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE, contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL, gross NUMERIC(12,2) DEFAULT 0, deductions NUMERIC(12,2) DEFAULT 0, net NUMERIC(12,2) DEFAULT 0, lines_json TEXT, status VARCHAR(50) DEFAULT 'Draft', sent INTEGER DEFAULT 0, warnings_json TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
    `);

    // Departments
    const deptNames = ['Finance', 'HR', 'Engineering', 'Sales', 'Support', 'IT'];
    const dept: Record<string, number> = {};
    for (const name of deptNames) {
      const res = await client.query('INSERT INTO departments (name) VALUES ($1) RETURNING id', [name]);
      dept[name] = res.rows[0].id;
    }

    // Working schedules
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    async function mkSchedule(name: string, company: string, days: Array<{ day: string; start: string; end: string; breakHours: number }>): Promise<number> {
      const res = await client.query('INSERT INTO working_schedules (name, company, days_per_week, schedule_json) VALUES ($1,$2,$3,$4) RETURNING id', [name, company, days.length, JSON.stringify(days)]);
      return res.rows[0].id;
    }
    const sched40 = await mkSchedule('40 Hours / Week', 'My Company', weekdays.map(d => ({ day: d, start: '09:00', end: '18:00', breakHours: 1 })));
    const schedNight = await mkSchedule('Night Shift', 'My Company', weekdays.map(d => ({ day: d, start: '22:00', end: '23:59', breakHours: 0 })));
    const schedRetail = await mkSchedule('Retail Weekend', 'My Company', ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'].map(d => ({ day: d, start: '10:00', end: '19:00', breakHours: 1 })));
    const schedFlex = await mkSchedule('Flexible Hybrid', 'My Company', weekdays.map(d => ({ day: d, start: '09:30', end: '17:00', breakHours: 0.5 })));
    const schedPart = await mkSchedule('Part-time', 'My Company', ['Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(d => ({ day: d, start: '09:00', end: '14:00', breakHours: 0 })));

    // Employees
    async function mkEmployee(name: string, email: string, position: string, departmentId: number, managerId: number | null, scheduleId: number, bank: string | null): Promise<number> {
      const res = await client.query(`
        INSERT INTO employees (name, email, phone, position, department_id, manager_id, schedule_id, company, work_location, bank_account, status, avatar_initials)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'OXP Pvt Ltd', 'Mumbai', $8, 'Active', $9) RETURNING id
      `, [name, email, '+91 98' + Math.floor(10000000 + Math.random() * 89999999), position, departmentId, managerId, scheduleId, bank, initials(name)]);
      return res.rows[0].id;
    }

    const sara = await mkEmployee('Sara Khan', 'sara@oxp.com', 'HR Officer', dept.HR, null, sched40, 'HDFC-XXXX-2231');
    const aarav = await mkEmployee('Aarav Mehta', 'aarav@oxp.com', 'Payroll Specialist', dept.Finance, sara, sched40, 'ICICI-XXXX-9981');
    const john = await mkEmployee('John Dsouza', 'john@oxp.com', 'Developer', dept.Engineering, sara, sched40, null);
    const neha = await mkEmployee('Neha Rao', 'neha@oxp.com', 'Sales Executive', dept.Sales, sara, schedFlex, 'AXIS-XXXX-1145');
    const priya = await mkEmployee('Priya Nair', 'priya@oxp.com', 'Support Lead', dept.Support, sara, schedRetail, 'SBI-XXXX-7723');
    const rohan = await mkEmployee('Rohan Verma', 'rohan@oxp.com', 'IT Administrator', dept.IT, sara, schedPart, 'HDFC-XXXX-4432');

    // Salary structure + rules
    const structRes = await client.query('INSERT INTO salary_structures (name) VALUES ($1) RETURNING id', ['Employee Salary']);
    const structId = structRes.rows[0].id;

    async function rule(name: string, category: string, method: string, extra: { amount?: number; percentage?: number; percentage_of?: string; formula_key?: string }, seq: number) {
      await client.query(`
        INSERT INTO salary_rules (structure_id, name, category, compute_method, amount, percentage, percentage_of, formula_key, sequence)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [structId, name, category, method, extra.amount || null, extra.percentage || null, extra.percentage_of || null, extra.formula_key || null, seq]);
    }

    await rule('Basic Salary', 'Basic', 'FIXED', {}, 10);
    await rule('HRA', 'Allowance', 'PERCENTAGE', { percentage: 20, percentage_of: 'BASIC' }, 20);
    await rule('Transport Allowance', 'Allowance', 'FIXED', { amount: 2000 }, 30);
    await rule('Overtime Pay', 'Allowance', 'FORMULA', { formula_key: 'OVERTIME' }, 40);
    await rule('Unpaid Leave Deduction', 'Deduction', 'FORMULA', { formula_key: 'UNPAID_LEAVE_DEDUCTION' }, 50);
    await rule('Provident Fund (PF)', 'Deduction', 'PERCENTAGE', { percentage: 12, percentage_of: 'BASIC' }, 60);
    await rule('Professional Tax', 'Deduction', 'FIXED', { amount: 2500 }, 70);

    // Contracts
    async function mkContract(ref: string, empId: number, start: string, end: string | null, wage: number, status: string, department: string, position: string, scheduleId: number) {
      const res = await client.query(`
        INSERT INTO contracts (ref, employee_id, start_date, end_date, wage, status, department, position, schedule_id, salary_structure_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id
      `, [ref, empId, start, end, wage, status, department, position, scheduleId, structId]);
      return res.rows[0].id;
    }

    await mkContract('CON/2025/0018', aarav, '2025-07-01', '2025-12-31', 78000, 'Expired', 'Finance', 'Payroll Specialist', sched40);
    await mkContract('CON/2026/0042', aarav, '2026-01-01', null, 85000, 'Running', 'Finance', 'Payroll Specialist', sched40);
    await mkContract('CON/2026/0031', sara, '2026-01-01', null, 95000, 'Running', 'HR', 'HR Officer', sched40);
    await mkContract('CON/2026/0050', john, '2026-01-01', null, 72000, 'Running', 'Engineering', 'Developer', sched40);
    await mkContract('CON/2026/0055', neha, '2026-01-01', '2026-09-25', 68000, 'Running', 'Sales', 'Sales Executive', schedFlex);
    await mkContract('CON/2026/0060', priya, '2026-02-01', null, 74000, 'Running', 'Support', 'Support Lead', schedRetail);
    await mkContract('CON/2026/0065', rohan, '2026-02-01', null, 60000, 'Running', 'IT', 'IT Administrator', schedPart);

    // Attendance
    const allEmployees = [aarav, sara, john, neha, priya, rohan];
    async function addAttendance(empId: number, day: number, checkInHour: number | null, checkOutHour: number | null, status: string) {
      const date = `2026-09-${String(day).padStart(2, '0')}`;
      let checkIn: string | null = null, checkOut: string | null = null, worked = 0, overtime = 0;
      if (checkInHour != null && checkOutHour != null) {
        checkIn = `${date}T${String(checkInHour).padStart(2, '0')}:05:00.000Z`;
        checkOut = `${date}T${String(checkOutHour).padStart(2, '0')}:10:00.000Z`;
        worked = +(checkOutHour - checkInHour + 5 / 60).toFixed(2);
        overtime = worked > 8 ? +(worked - 8).toFixed(2) : 0;
      }
      await client.query(`
        INSERT INTO attendance (employee_id, date, check_in, check_out, worked_hours, overtime_hours, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'Seeded demo record')
      `, [empId, date, checkIn, checkOut, worked, overtime, status]);
    }

    for (let day = 1; day <= 4; day++) {
      await addAttendance(aarav, day, 9, day === 3 ? 19 : 18, 'Present');
      await addAttendance(sara, day, 9, 18, 'Present');
      await addAttendance(john, day, 9, 18, 'Present');
      await addAttendance(priya, day, 10, 19, 'Present');
      await addAttendance(rohan, day, 9, 14, 'Present');
      if (day === 2) await addAttendance(neha, day, null, null, 'Absent');
      else await addAttendance(neha, day, 9, 17, 'Present');
    }

    // Time off types
    const potRes = await client.query("INSERT INTO time_off_types (name, unit, allocation_required, approval_role) VALUES ('Paid Time Off','Days',1,'Manager') RETURNING id");
    const potId = potRes.rows[0].id;
    const sickRes = await client.query("INSERT INTO time_off_types (name, unit, allocation_required, approval_role) VALUES ('Sick Leave','Days',0,'Manager') RETURNING id");
    const sickId = sickRes.rows[0].id;
    await client.query("INSERT INTO time_off_types (name, unit, allocation_required, approval_role) VALUES ('Comp Off','Hours',1,'Officer')");
    await client.query("INSERT INTO time_off_types (name, unit, allocation_required, approval_role) VALUES ('Unpaid Leave','Days',0,'Manager')");

    // Allocations
    for (const emp of allEmployees) {
      await client.query("INSERT INTO time_off_allocations (employee_id, type_id, allocated, taken, status, approver_id) VALUES ($1,$2,$3,$4,'Approved',$5)", [emp, potId, 20, emp === aarav ? 8 : Math.floor(Math.random() * 6), sara]);
      await client.query("INSERT INTO time_off_allocations (employee_id, type_id, allocated, taken, status, approver_id) VALUES ($1,$2,$3,$4,'Approved',$5)", [emp, sickId, 10, Math.floor(Math.random() * 3), sara]);
    }

    // Requests
    await client.query("INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, reason, status) VALUES ($1, $2, '2026-09-12', '2026-09-14', 3, 'Family vacation', 'To Approve')", [aarav, potId]);
    await client.query("INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, reason, status) VALUES ($1, $2, '2026-08-05', '2026-08-06', 2, 'Fever', 'Approved')", [john, sickId]);
    await client.query("INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, reason, status) VALUES ($1, $2, '2026-08-20', '2026-08-20', 1, 'Personal errand', 'Approved')", [neha, potId]);

    // Users
    async function mkUser(email: string, password: string, roles: string[], employeeId: number) {
      const hash = bcrypt.hashSync(password, 10);
      await client.query("INSERT INTO users (employee_id, email, password_hash, roles, status) VALUES ($1,$2,$3,$4,'Active')", [employeeId, email, hash, roles.join(',')]);
    }
    await mkUser('admin@oxp.com', 'admin123', ['HR Payroll Admin', 'HR Manager', 'Employee'], sara);
    await mkUser('aarav@oxp.com', 'payroll123', ['HR Payroll User', 'Employee'], aarav);
    await mkUser('john@oxp.com', 'employee123', ['Employee'], john);
    await mkUser('neha@oxp.com', 'employee123', ['Employee'], neha);

    // Payruns
    for (const { y, m } of [{ y: 2026, m: 4 }, { y: 2026, m: 5 }, { y: 2026, m: 6 }, { y: 2026, m: 7 }, { y: 2026, m: 8 }]) {
      const prRes = await client.query("INSERT INTO payruns (period_month, period_year, structure_id, company, status) VALUES ($1,$2,$3,'OXP Pvt Ltd','Paid') RETURNING id", [m, y, structId]);
      const runId = prRes.rows[0].id;
      for (const eid of allEmployees) {
        await client.query(`INSERT INTO payslips (payrun_id, employee_id, contract_id, gross, deductions, net, lines_json, status, sent, warnings_json) VALUES ($1,$2,null,75000,12000,63000,'[]','Paid',1,'[]')`, [runId, eid]);
      }
    }

    await client.end();
    console.log('PostgreSQL seed complete!');
    console.log('Demo logins:');
    console.log('  Admin:   admin@oxp.com / admin123');
    console.log('  Payroll: aarav@oxp.com / payroll123');
    console.log('  Employee: john@oxp.com / employee123');
  }
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
