import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-hackathon-secret-key-2026';

export interface AuthRequest extends Request {
  user?: any;
}

export function parseUserRoles(user: any): string[] {
  const rawRole = user?.role || user?.roles;
  if (!rawRole) return [];
  let rolesList: string[] = [];
  if (Array.isArray(rawRole)) {
    rolesList = [...rawRole];
  } else if (typeof rawRole === 'string') {
    rolesList = rawRole.split(',').map((r: string) => r.trim()).filter(Boolean);
  }

  if (rolesList.includes('Admin')) {
    if (!rolesList.includes('HR Payroll Admin')) rolesList.push('HR Payroll Admin');
    if (!rolesList.includes('HR Manager')) rolesList.push('HR Manager');
    if (!rolesList.includes('HR Payroll User')) rolesList.push('HR Payroll User');
  }
  if (rolesList.includes('HR Manager')) {
    if (!rolesList.includes('HR Payroll User')) rolesList.push('HR Payroll User');
  }
  return rolesList;
}

export function signToken(user: any) {
  const roles = parseUserRoles(user);
  return jwt.sign(
    { id: user.id, email: user.email, roles, employee_id: user.employee_id },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

export function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Bearer token required' });
  }
  const token = header.split(' ')[1];
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    const rawRoles = payload.roles;
    if (Array.isArray(rawRoles)) {
      req.user.rolesArr = rawRoles;
    } else if (typeof rawRoles === 'string') {
      req.user.rolesArr = rawRoles.split(',').map((r: string) => r.trim()).filter(Boolean);
    } else {
      req.user.rolesArr = [];
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const roles: string[] = req.user.rolesArr || [];
    if (roles.includes('HR Payroll Admin') || roles.includes('Admin')) return next();
    const ok = allowedRoles.some((r) => roles.includes(r));
    if (!ok) return res.status(403).json({ error: `Forbidden: requires one of [${allowedRoles.join(', ')}]` });
    next();
  };
}
