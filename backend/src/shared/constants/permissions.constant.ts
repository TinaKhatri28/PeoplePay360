export const Permissions = {
  // Employee permissions
  EMPLOYEE_READ: 'employee.read',
  EMPLOYEE_CREATE: 'employee.create',
  EMPLOYEE_UPDATE: 'employee.update',
  EMPLOYEE_DELETE: 'employee.delete',

  // Contract permissions
  CONTRACT_READ: 'contract.read',
  CONTRACT_MANAGE: 'contract.manage',

  // Schedule permissions
  SCHEDULE_READ: 'schedule.read',
  SCHEDULE_MANAGE: 'schedule.manage',

  // Attendance permissions
  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_CORRECT: 'attendance.correct',

  // Leave permissions
  LEAVE_REQUEST: 'leave.request',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_READ: 'leave.read',

  // Salary structure permissions
  SALARY_READ: 'salary.read',
  SALARY_MANAGE: 'salary.manage',

  // Payroll & Payrun permissions
  PAYROLL_RUN: 'payroll.run',
  PAYROLL_APPROVE: 'payroll.approve',
  PAYROLL_PAY: 'payroll.pay',

  // Payslip permissions
  PAYSLIP_READ: 'payslip.read',
  PAYSLIP_GENERATE: 'payslip.generate',

  // Dashboard & Reports
  DASHBOARD_VIEW: 'dashboard.view',
  REPORT_VIEW: 'report.view',

  // Administration
  ADMIN_MANAGE: 'admin.manage',
} as const;

export type PermissionKey = typeof Permissions[keyof typeof Permissions];
