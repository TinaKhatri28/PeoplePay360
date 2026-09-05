import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

async function main() {
  console.log('🌱 Seeding PeoplePay360 Enterprise DB with Prisma...');

  // 1. Clear existing data in reverse FK order
  await prisma.auditLog.deleteMany();
  await prisma.payslipLine.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payrun.deleteMany();
  await prisma.salaryRule.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveAllocation.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.employmentContract.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.workingSchedule.deleteMany();
  await prisma.department.deleteMany();
  await prisma.organization.deleteMany();

  // 2. Organization (Root Tenant)
  const org = await prisma.organization.create({
    data: {
      name: 'OXP Pvt Ltd',
      code: 'OXP',
      currency: 'USD',
      timezone: 'UTC',
    },
  });

  // 3. Departments
  const deptNames = ['Finance', 'HR', 'Engineering', 'Sales', 'Support', 'IT'];
  const depts: Record<string, any> = {};
  for (const name of deptNames) {
    depts[name] = await prisma.department.create({
      data: { organization_id: org.id, name },
    });
  }

  // 4. Working Schedules
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const sched40 = await prisma.workingSchedule.create({
    data: {
      organization_id: org.id,
      name: '40 Hours / Week',
      standard_hours: 8,
      days_per_week: 5,
      schedule_json: JSON.stringify(weekdays.map((d) => ({ day: d, start: '09:00', end: '18:00', breakHours: 1 }))),
    },
  });

  const schedFlex = await prisma.workingSchedule.create({
    data: {
      organization_id: org.id,
      name: 'Flexible Hybrid',
      standard_hours: 7.5,
      days_per_week: 5,
      schedule_json: JSON.stringify(weekdays.map((d) => ({ day: d, start: '09:30', end: '17:00', breakHours: 0.5 }))),
    },
  });

  const schedRetail = await prisma.workingSchedule.create({
    data: {
      organization_id: org.id,
      name: 'Retail Weekend',
      standard_hours: 8,
      days_per_week: 5,
      schedule_json: JSON.stringify(['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'].map((d) => ({ day: d, start: '10:00', end: '19:00', breakHours: 1 }))),
    },
  });

  const schedPart = await prisma.workingSchedule.create({
    data: {
      organization_id: org.id,
      name: 'Part-time',
      standard_hours: 5,
      days_per_week: 4,
      schedule_json: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday'].map((d) => ({ day: d, start: '09:00', end: '14:00', breakHours: 0 }))),
    },
  });

  // 5. Employees
  async function createEmp(firstName: string, lastName: string, email: string, position: string, deptId: string, scheduleId: string, bank: string | null) {
    return prisma.employee.create({
      data: {
        organization_id: org.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: '+91 98' + Math.floor(10000000 + Math.random() * 89999999),
        position,
        department_id: deptId,
        schedule_id: scheduleId,
        work_location: 'Mumbai',
        bank_account: bank,
        status: 'Active',
        avatar_initials: initials(`${firstName} ${lastName}`),
        joining_date: new Date('2025-01-15'),
      },
    });
  }

  const sara = await createEmp('Sara', 'Khan', 'sara@oxp.com', 'HR Officer', depts.HR.id, sched40.id, 'HDFC-XXXX-2231');
  const aarav = await createEmp('Aarav', 'Mehta', 'aarav@oxp.com', 'Payroll Specialist', depts.Finance.id, sched40.id, 'ICICI-XXXX-9981');
  const john = await createEmp('John', 'Dsouza', 'john@oxp.com', 'Developer', depts.Engineering.id, sched40.id, null); // missing bank for warning demo
  const neha = await createEmp('Neha', 'Rao', 'neha@oxp.com', 'Sales Executive', depts.Sales.id, schedFlex.id, 'AXIS-XXXX-1145');
  const priya = await createEmp('Priya', 'Nair', 'priya@oxp.com', 'Support Lead', depts.Support.id, schedRetail.id, 'SBI-XXXX-7723');
  const rohan = await createEmp('Rohan', 'Verma', 'rohan@oxp.com', 'IT Administrator', depts.IT.id, schedPart.id, 'HDFC-XXXX-4432');

  const allEmployees = [sara, aarav, john, neha, priya, rohan];

  // 6. Users for Authentication
  const passwordHash = await bcrypt.hash('admin123', 10);
  const payrollHash = await bcrypt.hash('payroll123', 10);
  const empHash = await bcrypt.hash('employee123', 10);

  await prisma.user.create({
    data: {
      organization_id: org.id,
      employee_id: sara.id,
      email: 'admin@oxp.com',
      password_hash: passwordHash,
      role: 'Admin',
      status: 'Active',
    },
  });

  await prisma.user.create({
    data: {
      organization_id: org.id,
      employee_id: aarav.id,
      email: 'aarav@oxp.com',
      password_hash: payrollHash,
      role: 'HR Payroll User',
      status: 'Active',
    },
  });

  await prisma.user.create({
    data: {
      organization_id: org.id,
      employee_id: john.id,
      email: 'john@oxp.com',
      password_hash: empHash,
      role: 'Employee',
      status: 'Active',
    },
  });

  await prisma.user.create({
    data: {
      organization_id: org.id,
      employee_id: neha.id,
      email: 'neha@oxp.com',
      password_hash: empHash,
      role: 'Employee',
      status: 'Active',
    },
  });

  // 7. Salary Structure & Rules
  const structure = await prisma.salaryStructure.create({
    data: {
      organization_id: org.id,
      name: 'Standard Employee Salary',
      code: 'STD_EMP',
      description: 'Standard salary structure with HRA, Transport, PF & Tax',
    },
  });

  const structId = structure.id;

  await prisma.salaryRule.createMany({
    data: [
      { organization_id: org.id, structure_id: structId, name: 'Basic Salary', category: 'Basic', compute_method: 'FIXED', sequence: 10 },
      { organization_id: org.id, structure_id: structId, name: 'HRA', category: 'Allowance', compute_method: 'PERCENTAGE', percentage: 20, percentage_of: 'BASIC', sequence: 20 },
      { organization_id: org.id, structure_id: structId, name: 'Transport Allowance', category: 'Allowance', compute_method: 'FIXED', amount: 2000, sequence: 30 },
      { organization_id: org.id, structure_id: structId, name: 'Overtime Pay', category: 'Allowance', compute_method: 'FORMULA', formula_key: 'OVERTIME', sequence: 40 },
      { organization_id: org.id, structure_id: structId, name: 'Unpaid Leave Deduction', category: 'Deduction', compute_method: 'FORMULA', formula_key: 'UNPAID_LEAVE_DEDUCTION', sequence: 50 },
      { organization_id: org.id, structure_id: structId, name: 'Provident Fund (PF)', category: 'Deduction', compute_method: 'PERCENTAGE', percentage: 12, percentage_of: 'BASIC', sequence: 60 },
      { organization_id: org.id, structure_id: structId, name: 'Professional Tax', category: 'Deduction', compute_method: 'FIXED', amount: 2500, sequence: 70 },
    ],
  });

  // 8. Contracts
  async function createCon(ref: string, empId: string, start: string, end: string | null, wage: number, deptName: string, pos: string, schedId: string) {
    return prisma.employmentContract.create({
      data: {
        organization_id: org.id,
        ref,
        employee_id: empId,
        start_date: new Date(start),
        end_date: end ? new Date(end) : null,
        wage,
        status: 'Running',
        department: deptName,
        position: pos,
        schedule_id: schedId,
        salary_structure_id: structId,
      },
    });
  }

  await createCon('CON/2026/0031', sara.id, '2026-01-01', null, 95000, 'HR', 'HR Officer', sched40.id);
  await createCon('CON/2026/0042', aarav.id, '2026-01-01', null, 85000, 'Finance', 'Payroll Specialist', sched40.id);
  await createCon('CON/2026/0050', john.id, '2026-01-01', null, 72000, 'Engineering', 'Developer', sched40.id);
  await createCon('CON/2026/0055', neha.id, '2026-01-01', '2026-09-25', 68000, 'Sales', 'Sales Executive', schedFlex.id);
  await createCon('CON/2026/0060', priya.id, '2026-02-01', null, 74000, 'Support', 'Support Lead', schedRetail.id);
  await createCon('CON/2026/0065', rohan.id, '2026-02-01', null, 60000, 'IT', 'IT Administrator', schedPart.id);

  // 9. Attendance records for Sept 2026
  for (let day = 1; day <= 4; day++) {
    const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
    for (const emp of allEmployees) {
      if (emp.id === neha.id && day === 2) {
        await prisma.attendanceRecord.create({
          data: {
            organization_id: org.id,
            employee_id: emp.id,
            date: dateStr,
            status: 'Absent',
            worked_hours: 0,
            overtime_hours: 0,
            notes: 'Unplanned absence',
          },
        });
      } else {
        const isOt = emp.id === aarav.id && day === 3;
        const checkIn = new Date(`${dateStr}T09:00:00.000Z`);
        const checkOut = new Date(`${dateStr}T${isOt ? '19' : '18'}:00:00.000Z`);
        const worked = isOt ? 10 : 8;
        const ot = isOt ? 2 : 0;

        await prisma.attendanceRecord.create({
          data: {
            organization_id: org.id,
            employee_id: emp.id,
            date: dateStr,
            check_in: checkIn,
            check_out: checkOut,
            worked_hours: worked,
            overtime_hours: ot,
            status: isOt ? 'Overtime' : 'Present',
            notes: 'Regular check-in',
          },
        });
      }
    }
  }

  // 10. Leave Types & Allocations
  const ptoType = await prisma.leaveType.create({
    data: { organization_id: org.id, name: 'Paid Time Off', code: 'PTO', unit: 'Days', is_paid: true },
  });
  const sickType = await prisma.leaveType.create({
    data: { organization_id: org.id, name: 'Sick Leave', code: 'SICK', unit: 'Days', is_paid: true },
  });
  const unpaidType = await prisma.leaveType.create({
    data: { organization_id: org.id, name: 'Unpaid Leave', code: 'UNPAID', unit: 'Days', is_paid: false },
  });

  for (const emp of allEmployees) {
    await prisma.leaveAllocation.create({
      data: {
        organization_id: org.id,
        employee_id: emp.id,
        type_id: ptoType.id,
        allocated: 20,
        taken: emp.id === aarav.id ? 8 : 2,
        status: 'Approved',
        approver_id: sara.id,
      },
    });
    await prisma.leaveAllocation.create({
      data: {
        organization_id: org.id,
        employee_id: emp.id,
        type_id: sickType.id,
        allocated: 10,
        taken: 1,
        status: 'Approved',
        approver_id: sara.id,
      },
    });
  }

  // Pending leave request to demo approval workflow
  await prisma.leaveRequest.create({
    data: {
      organization_id: org.id,
      employee_id: aarav.id,
      type_id: ptoType.id,
      start_date: new Date('2026-09-12'),
      end_date: new Date('2026-09-14'),
      duration: 3,
      reason: 'Family vacation',
      status: 'To Approve',
    },
  });

  // 11. Historical Payruns (May - Aug 2026) for Dashboard Trends
  for (const m of [5, 6, 7, 8]) {
    const payrun = await prisma.payrun.create({
      data: {
        organization_id: org.id,
        period_month: m,
        period_year: 2026,
        structure_id: structId,
        status: 'Paid',
        total_gross: 454000,
        total_deductions: 62480,
        total_net: 391520,
      },
    });

    for (const emp of allEmployees) {
      await prisma.payslip.create({
        data: {
          organization_id: org.id,
          payrun_id: payrun.id,
          employee_id: emp.id,
          gross: 75000,
          deductions: 10500,
          net: 64500,
          lines_json: JSON.stringify([
            { name: 'Basic Salary', category: 'Basic', amount: 60000 },
            { name: 'HRA', category: 'Allowance', amount: 12000 },
            { name: 'Transport Allowance', category: 'Allowance', amount: 2000 },
            { name: 'Provident Fund (PF)', category: 'Deduction', amount: 7200 },
            { name: 'Professional Tax', category: 'Deduction', amount: 2500 },
          ]),
          warnings_json: '[]',
          status: 'Paid',
          sent: true,
        },
      });
    }
  }

  console.log('✅ Seeding complete!');
  console.log('--------------------------------------------------');
  console.log('🔑 Demo Login Accounts:');
  console.log('   Admin:      admin@oxp.com  / admin123');
  console.log('   Payroll:    aarav@oxp.com  / payroll123');
  console.log('   Employee:   john@oxp.com   / employee123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
