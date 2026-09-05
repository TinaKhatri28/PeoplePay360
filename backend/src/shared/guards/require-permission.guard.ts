import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, AuthenticationError } from '../errors/app.error';
import { PermissionKey } from '../constants/permissions.constant';
import { RolePermissionsMap, RoleName, Roles } from '../constants/roles.constant';

export const requirePermission = (...requiredPermissions: PermissionKey[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const userRole = req.user.role as RoleName;

    // Admin has superuser access
    if (userRole === Roles.ADMIN) {
      return next();
    }

    // Role-to-permission resolution
    const rolePerms = RolePermissionsMap[userRole] || [];
    const directPerms = req.user.permissions || [];
    const allUserPerms = new Set([...rolePerms, ...directPerms]);

    const hasPermission = requiredPermissions.some((perm) => allUserPerms.has(perm));
    if (!hasPermission) {
      throw new ForbiddenError(
        `Missing required permission: ${requiredPermissions.join(' or ')}`
      );
    }

    next();
  };
};

/**
 * Backward-compatible role guard for existing frontend routes
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const rawRole = req.user.role;
    const userRoles: string[] = Array.isArray(rawRole)
      ? rawRole
      : typeof rawRole === 'string'
      ? rawRole.split(',').map((r) => r.trim())
      : [];
    
    // Admin or HR Payroll Admin always passes
    if (userRoles.includes(Roles.ADMIN) || userRoles.includes('Admin') || userRoles.includes('HR Payroll Admin')) {
      return next();
    }

    const hasRole = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenError(`Access restricted to roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};
