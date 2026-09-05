const bcrypt = require('bcryptjs');
const db = require('./db');

function initials(name) { return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase(); }

console.log('Seeding PeoplePay360 demo data...');

// Clear existing data (idempotent re-seed) — children before parents to satisfy FK constraints
db.pragma('foreign_keys = OFF');
const tables = ['payslips', 'payruns', 'salary_rules', 'salary_structures', 'time_off_requests',
  'time_off_allocations', 'time_off_types', 'attendance', 'contracts', 'users', 'employees',
  'working_schedules', 'departments'];
for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();
db.pragma('foreign_keys = ON');

// Departments
const deptNames = ['Finance', 'HR', 'Engineering', 'Sales', 'Support', 'IT'];
const dept = {};
for (const name of deptNames) {
  const info = db.prepare('INSERT INTO departments (name) VALUES (?)').run(name);
  dept[name] = info.lastInsertRowid;
}

// Working schedules
function mkSchedule(name, company, days) {
  return db.prepare('INSERT INTO working_schedules (name, company, days_per_week, schedule_json) VALUES (?,?,?,?)')
    .run(name, company, days.length, JSON.stringify(days)).lastInsertRowid;
}
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const sched40 = mkSchedule('40 Hours / Week', 'My Company', weekdays.map(d => ({ day: d, start: '09:00', end: '18:00', breakHours: 1 })));
const schedNight = mkSchedule('Night Shift', 'My Company', weekdays.map(d => ({ day: d, start: '22:00', end: '23:59', breakHours: 0 })));
const schedRetail = mkSchedule('Retail Weekend', 'My Company', ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'].map(d => ({ day: d, start: '10:00', end: '19:00', breakHours: 1 })));
const schedFlex = mkSchedule('Flexible Hybrid', 'My Company', weekdays.map(d => ({ day: d, start: '09:30', end: '17:00', breakHours: 0.5 })));
const schedPart = mkSchedule('Part-time', 'My Company', ['Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(d => ({ day: d, start: '09:00', end: '14:00', breakHours: 0 })));

// Employees
function mkEmployee(name, email, position, departmentId, managerId, scheduleId, bank) {
  return db.prepare(`
    INSERT INTO employees (name, email, phone, position, department_id, manager_id, schedule_id, company, work_location, bank_account, status, avatar_initials)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'OXP Pvt Ltd', 'Mumbai', ?, 'Active', ?)
  `).run(name, email, '+91 98' + Math.floor(10000000 + Math.random() * 89999999), position, departmentId,
         managerId, scheduleId, bank, initials(name)).lastInsertRowid;
}

const sara = mkEmployee('Sara Khan', 'sara@oxp.com', 'HR Officer', dept.HR, null, sched40, 'HDFC-XXXX-2231');
const aarav = mkEmployee('Aarav Mehta', 'aarav@oxp.com', 'Payroll Specialist', dept.Finance, sara, sched40, 'ICICI-XXXX-9981');
const john = mkEmployee('John Dsouza', 'john@oxp.com', 'Developer', dept.Engineering, sara, sched40, null); // missing bank -> validation warning
const neha = mkEmployee('Neha Rao', 'neha@oxp.com', 'Sales Executive', dept.Sales, sara, schedFlex, 'AXIS-XXXX-1145');
const priya = mkEmployee('Priya Nair', 'priya@oxp.com', 'Support Lead', dept.Support, sara, schedRetail, 'SBI-XXXX-7723');
const rohan = mkEmployee('Rohan Verma', 'rohan@oxp.com', 'IT Administrator', dept.IT, sara, schedPart, 'HDFC-XXXX-4432');

// Salary structure + rules
const structId = db.prepare('INSERT INTO salary_structures (name) VALUES (?)').run('Employee Salary').lastInsertRowid;
const rule = (name, category, method, extra, seq) => db.prepare(`
  INSERT INTO salary_rules (structure_id, name, category, compute_method, amount, percentage, percentage_of, formula_key, sequence)
  VALUES (?,?,?,?,?,?,?,?,?)
`).run(structId, name, category, method, extra.amount || null, extra.percentage || null, extra.percentage_of || null, extra.formula_key || null, seq);

rule('Basic Salary', 'Basic', 'FIXED', {}, 10); // amount overridden by contract wage in engine
rule('HRA', 'Allowance', 'PERCENTAGE', { percentage: 20, percentage_of: 'BASIC' }, 20);
rule('Transport Allowance', 'Allowance', 'FIXED', { amount: 2000 }, 30);
rule('Overtime Pay', 'Allowance', 'FORMULA', { formula_key: 'OVERTIME' }, 40);
rule('Unpaid Leave Deduction', 'Deduction', 'FORMULA', { formula_key: 'UNPAID_LEAVE_DEDUCTION' }, 50);
rule('Provident Fund (PF)', 'Deduction', 'PERCENTAGE', { percentage: 12, percentage_of: 'BASIC' }, 60);
rule('Professional Tax', 'Deduction', 'FIXED', { amount: 2500 }, 70);

// Contracts (historical + running)
function mkContract(ref, empId, start, end, wage, status, department, position, scheduleId) {
  return db.prepare(`
    INSERT INTO contracts (ref, employee_id, start_date, end_date, wage, status, department, position, schedule_id, salary_structure_id)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(ref, empId, start, end, wage, status, department, position, scheduleId, structId).lastInsertRowid;
}

mkContract('CON/2025/0018', aarav, '2025-07-01', '2025-12-31', 78000, 'Expired', 'Finance', 'Payroll Specialist', sched40);
mkContract('CON/2026/0042', aarav, '2026-01-01', null, 85000, 'Running', 'Finance', 'Payroll Specialist', sched40);
mkContract('CON/2026/0031', sara, '2026-01-01', null, 95000, 'Running', 'HR', 'HR Officer', sched40);
mkContract('CON/2026/0050', john, '2026-01-01', null, 72000, 'Running', 'Engineering', 'Developer', sched40);
// Neha's contract expiring soon (within 30 days of Sep 2026 period end -> validation warning demo)
mkContract('CON/2026/0055', neha, '2026-01-01', '2026-09-25', 68000, 'Running', 'Sales', 'Sales Executive', schedFlex);
mkContract('CON/2026/0060', priya, '2026-02-01', null, 74000, 'Running', 'Support', 'Support Lead', schedRetail);
mkContract('CON/2026/0065', rohan, '2026-02-01', null, 60000, 'Running', 'IT', 'IT Administrator', schedPart);

// Attendance for Sept 2026 (a handful of days per employee)
const allEmployees = [aarav, sara, john, neha, priya, rohan];
function addAttendance(empId, day, checkInHour, checkOutHour, status) {
  const date = `2026-09-${String(day).padStart(2, '0')}`;
  let checkIn = null, checkOut = null, worked = 0, overtime = 0;
  if (checkInHour != null) {
    checkIn = `${date}T${String(checkInHour).padStart(2, '0')}:05:00.000Z`;
    checkOut = `${date}T${String(checkOutHour).padStart(2, '0')}:10:00.000Z`;
    worked = +(checkOutHour - checkInHour + 5 / 60).toFixed(2);
    overtime = worked > 8 ? +(worked - 8).toFixed(2) : 0;
  }
  db.prepare(`
    INSERT INTO attendance (employee_id, date, check_in, check_out, worked_hours, overtime_hours, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Seeded demo record')
  `).run(empId, date, checkIn, checkOut, worked, overtime, status);
}

for (let day = 1; day <= 4; day++) {
  addAttendance(aarav, day, 9, day === 3 ? 19 : 18, 'Present'); // day 3 has overtime
  addAttendance(sara, day, 9, 18, 'Present');
  addAttendance(john, day, 9, 18, 'Present');
  addAttendance(priya, day, 10, 19, 'Present');
  addAttendance(rohan, day, 9, 14, 'Present');
  if (day === 2) addAttendance(neha, day, null, null, 'Absent');
  else addAttendance(neha, day, 9, 17, 'Present');
}

// Time off types
const potId = db.prepare("INSERT INTO time_off_types (name, unit, allocation_required, approval_role) VALUES ('Paid Time Off','Days',1,'Manager')").run().lastInsertRowid;
const sickId = db.prepare("INSERT INTO time_off_types (name, unit, allocation_required, approval_role) VALUES ('Sick Leave','Days',0,'Manager')").run().lastInsertRowid;
const compId = db.prepare("INSERT INTO time_off_types (name, unit, allocation_required, approval_role) VALUES ('Comp Off','Hours',1,'Officer')").run().lastInsertRowid;
const unpaidId = db.prepare("INSERT INTO time_off_types (name, unit, allocation_required, approval_role) VALUES ('Unpaid Leave','Days',0,'Manager')").run().lastInsertRowid;

// Allocations
function allocate(empId, typeId, allocated, taken, approver) {
  db.prepare('INSERT INTO time_off_allocations (employee_id, type_id, allocated, taken, status, approver_id) VALUES (?,?,?,?,\'Approved\',?)')
    .run(empId, typeId, allocated, taken, approver);
}
for (const emp of allEmployees) {
  allocate(emp, potId, 20, emp === aarav ? 8 : Math.floor(Math.random() * 6), sara);
  allocate(emp, sickId, 10, Math.floor(Math.random() * 3), sara);
}

// A pending request (to demo approve flow) + a couple already approved
db.prepare(`
  INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, reason, status)
  VALUES (?, ?, '2026-09-12', '2026-09-14', 3, 'Family vacation', 'To Approve')
`).run(aarav, potId);
db.prepare(`
  INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, reason, status)
  VALUES (?, ?, '2026-08-05', '2026-08-06', 2, 'Fever', 'Approved')
`).run(john, sickId);
db.prepare(`
  INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, reason, status)
  VALUES (?, ?, '2026-08-20', '2026-08-20', 1, 'Personal errand', 'Approved')
`).run(neha, potId);

// Users (accounts) - one per role for demo login
function mkUser(email, password, roles, employeeId) {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (employee_id, email, password_hash, roles, status) VALUES (?,?,?,?,\'Active\')')
    .run(employeeId, email, hash, roles.join(','));
}
mkUser('admin@oxp.com', 'admin123', ['HR Payroll Admin', 'HR Manager', 'Employee'], sara);
mkUser('aarav@oxp.com', 'payroll123', ['HR Payroll User', 'Employee'], aarav);
mkUser('john@oxp.com', 'employee123', ['Employee'], john);
mkUser('neha@oxp.com', 'employee123', ['Employee'], neha);

// A Payrun for August 2026 already Paid (so dashboard trend has history)
function runPayrunForMonth(year, month, employeeIds, status) {
  const runId = db.prepare('INSERT INTO payruns (period_month, period_year, structure_id, company, status) VALUES (?,?,?,\'OXP Pvt Ltd\',?)')
    .run(month, year, structId, 'Draft').lastInsertRowid;
  const insertSlip = db.prepare(`INSERT INTO payslips (payrun_id, employee_id, contract_id, gross, deductions, net, lines_json, status, warnings_json) VALUES (?,?,?,0,0,0,'[]','Draft','[]')`);
  for (const eid of employeeIds) insertSlip.run(runId, eid, null);
  return runId;
}

const { computeEmployeePayslip } = require('./payrollEngine');
function computeAndFinalize(runId, year, month, status) {
  const slips = db.prepare('SELECT * FROM payslips WHERE payrun_id = ?').all(runId);
  const update = db.prepare(`UPDATE payslips SET gross=?, deductions=?, net=?, lines_json=?, warnings_json=?, status=?, contract_id=? WHERE id = ?`);
  for (const slip of slips) {
    const result = computeEmployeePayslip(slip.employee_id, year, month, structId);
    update.run(result.gross, result.deductions, result.net, JSON.stringify(result.lines), JSON.stringify(result.warnings), status, result.contract?.id || null, slip.id);
  }
  db.prepare('UPDATE payruns SET status = ? WHERE id = ?').run(status, runId);
}

// Historical months for a nice trend line (Apr-Aug 2026)
for (const { y, m } of [{ y: 2026, m: 4 }, { y: 2026, m: 5 }, { y: 2026, m: 6 }, { y: 2026, m: 7 }, { y: 2026, m: 8 }]) {
  const runId = runPayrunForMonth(y, m, allEmployees, 'Draft');
  computeAndFinalize(runId, y, m, 'Paid');
  db.prepare('UPDATE payruns SET status = \'Paid\' WHERE id = ?').run(runId);
}

console.log('Seed complete.');
console.log('Demo logins:');
console.log('  Admin:   admin@oxp.com / admin123');
console.log('  Payroll: aarav@oxp.com / payroll123');
console.log('  Employee: john@oxp.com / employee123');
