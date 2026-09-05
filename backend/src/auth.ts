import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-hackathon-secret-key-2026';

export interface AuthRequest extends Request {
  user?: any;
}

export function signToken(user: any) {
  return jwt.sign(
    { id: user.id, email: user.email, roles: user.roles, employee_id: user.employee_id },
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
    req.user.rolesArr = payload.roles ? payload.roles.split(',') : [];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const roles: string[] = req.user.rolesArr || [];
    if (roles.includes('HR Payroll Admin')) return next();
    const ok = allowedRoles.some((r) => roles.includes(r));
    if (!ok) return res.status(403).json({ error: `Forbidden: requires one of [${allowedRoles.join(', ')}]` });
    next();
  };
}
