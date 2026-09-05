/**
 * Utility functions for masking sensitive PII and financial information.
 */

/**
 * Masks a bank account number, keeping only the last 4 characters visible.
 * E.g., "123456789012" -> "**** **** 9012"
 */
export function maskBankAccount(account?: string | null): string {
  if (!account) return 'N/A';
  const clean = account.trim();
  if (clean.length <= 4) {
    return '****';
  }
  const last4 = clean.slice(-4);
  return `**** **** ${last4}`;
}

/**
 * Masks employee PII fields (such as bank_account) if the requester does not have privileged access
 * (e.g. Admin, HR Manager, HR Payroll Admin, HR Payroll User, or the employee themselves).
 */
export function sanitizeEmployeePII<T extends Record<string, any>>(
  employee: T,
  isPrivilegedOrSelf: boolean
): T {
  if (!employee) return employee;
  if (isPrivilegedOrSelf) {
    return employee;
  }

  const sanitized: any = { ...employee };
  if ('bank_account' in sanitized && sanitized.bank_account) {
    sanitized.bank_account = maskBankAccount(sanitized.bank_account);
  }
  return sanitized as T;
}
