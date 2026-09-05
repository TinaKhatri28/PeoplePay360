import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthenticationError } from '../errors/app.error';
import { AuthenticatedUser } from '../types/express';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Authorization token required');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId || 'org_default',
      employeeId: decoded.employeeId || null,
      role: decoded.role || decoded.roles || 'Employee',
      permissions: decoded.permissions || [],
    };
    req.organizationId = req.user.organizationId;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token has expired');
    }
    throw new AuthenticationError('Invalid or malformed authentication token');
  }
};
