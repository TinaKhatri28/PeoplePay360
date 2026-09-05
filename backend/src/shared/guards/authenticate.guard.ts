import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthenticationError } from '../errors/app.error';
import { tokenBlacklistService } from '../utils/token-blacklist.service';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Authorization token required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const isRevoked = await tokenBlacklistService.isTokenRevoked(token);
    if (isRevoked) {
      return next(new AuthenticationError('Authentication token has been revoked'));
    }

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
      return next(new AuthenticationError('Token has expired'));
    }
    return next(new AuthenticationError('Invalid or malformed authentication token'));
  }
};
