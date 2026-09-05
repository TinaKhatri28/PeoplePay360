import { Request, Response, NextFunction } from 'express';

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.organizationId) {
    req.organizationId = req.user.organizationId;
  }
  next();
};
