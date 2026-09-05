import { RoleName } from '../constants/roles.constant';
import { PermissionKey } from '../constants/permissions.constant';

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  employeeId?: string | null;
  role: RoleName | string;
  permissions: PermissionKey[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      organizationId?: string;
      requestId?: string;
    }
  }
}
