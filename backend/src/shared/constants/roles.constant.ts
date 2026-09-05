import { Permissions, PermissionKey } from './permissions.constant';

export const Roles = {
  ADMIN: 'Admin',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_ADMIN: 'HR Payroll Admin',
  HR_PAYROLL_USER: 'HR Payroll User',
  EMPLOYEE: 'Employee',
} as const;

export type RoleName = typeof Roles[keyof typeof Roles];

export const RolePermissionsMap: Record<RoleName, PermissionKey[]> = {
  [Roles.ADMIN]: Object.values(Permissions),
  
  [Roles.HR_PAYROLL_ADMIN]: [
    Permissions.EMPLOYEE_READ,
    Permissions.EMPLOYEE_CREATE,
    Permissions.EMPLOYEE_UPDATE,
    Permissions.CONTRACT_READ,
    Permissions.CONTRACT_MANAGE,
    Permissions.SCHEDULE_READ,
    Permissions.SCHEDULE_MANAGE,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_CORRECT,
    Permissions.LEAVE_READ,
    Permissions.LEAVE_APPROVE,
    Permissions.SALARY_READ,
    Permissions.SALARY_MANAGE,
    Permissions.PAYROLL_RUN,
    Permissions.PAYROLL_APPROVE,
    Permissions.PAYROLL_PAY,
    Permissions.PAYSLIP_READ,
    Permissions.PAYSLIP_GENERATE,
    Permissions.DASHBOARD_VIEW,
    Permissions.REPORT_VIEW,
  ],

  [Roles.HR_PAYROLL_USER]: [
    Permissions.EMPLOYEE_READ,
    Permissions.CONTRACT_READ,
    Permissions.SCHEDULE_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.LEAVE_READ,
    Permissions.SALARY_READ,
    Permissions.PAYROLL_RUN,
    Permissions.PAYSLIP_READ,
    Permissions.PAYSLIP_GENERATE,
    Permissions.DASHBOARD_VIEW,
    Permissions.REPORT_VIEW,
  ],

  [Roles.HR_MANAGER]: [
    Permissions.EMPLOYEE_READ,
    Permissions.EMPLOYEE_CREATE,
    Permissions.EMPLOYEE_UPDATE,
    Permissions.EMPLOYEE_DELETE,
    Permissions.CONTRACT_READ,
    Permissions.CONTRACT_MANAGE,
    Permissions.SCHEDULE_READ,
    Permissions.SCHEDULE_MANAGE,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_CORRECT,
    Permissions.LEAVE_READ,
    Permissions.LEAVE_APPROVE,
    Permissions.SALARY_READ,
    Permissions.DASHBOARD_VIEW,
    Permissions.REPORT_VIEW,
  ],

  [Roles.EMPLOYEE]: [
    Permissions.ATTENDANCE_CREATE,
    Permissions.ATTENDANCE_READ,
    Permissions.LEAVE_REQUEST,
    Permissions.LEAVE_READ,
    Permissions.PAYSLIP_READ,
  ],
};
