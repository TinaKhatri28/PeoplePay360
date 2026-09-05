import { Request, Response, NextFunction } from 'express';

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.organizationId) {
    req.organizationId = req.user.organizationId;
  } else {
    // If headers specify tenant or fallback to default organization
    const headerOrgId = req.headers['x-organization-id'] as string;
    req.organizationId = headerOrgId || 'org_default';
  }
  next();
};
