import { Request, Response, NextFunction } from 'express';

/**
 * Multi-Tenancy Boundary Middleware:
 * Strictly enforces organization isolation derived from authenticated JWT claims.
 * Client-controlled headers (such as `x-organization-id`) are explicitly stripped
 * to prevent spoofing and cross-tenant privilege escalation.
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Discard any spoofed client headers
  if (req.headers && req.headers['x-organization-id']) {
    delete req.headers['x-organization-id'];
  }

  if (req.user && req.user.organizationId) {
    req.organizationId = req.user.organizationId;
  }
  next();
};
