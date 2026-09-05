export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details: any = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details: any = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied: insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class ContractOverlapError extends AppError {
  constructor(message = 'Employee already has an active contract for the specified period') {
    super(message, 409, 'CONTRACT_OVERLAP');
  }
}

export class InsufficientLeaveBalanceError extends AppError {
  constructor(message = 'Insufficient leave balance for this request') {
    super(message, 400, 'INSUFFICIENT_LEAVE_BALANCE');
  }
}

export class PayrollCalculationError extends AppError {
  constructor(message = 'Payroll calculation failed', details: any = null) {
    super(message, 422, 'PAYROLL_CALCULATION_ERROR', details);
  }
}
