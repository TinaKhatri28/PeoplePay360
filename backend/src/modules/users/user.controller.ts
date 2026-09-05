import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authService } from '../auth/auth.service';
import { NotFoundError, ValidationError, ForbiddenError } from '../../shared/errors/app.error';

const VALID_ROLES = ['Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User', 'Employee'] as const;

export class UserController {
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const users = await prisma.user.findMany({
        where: { organization_id: orgId },
        include: { employee: true },
        orderBy: { created_at: 'desc' },
      });

      res.json(
        users.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          roles: u.role,
          status: u.status,
          employee_id: u.employee_id,
          employee_name: u.employee ? `${u.employee.first_name} ${u.employee.last_name}` : null,
          created_at: u.created_at,
        }))
      );
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const { email, password, roles, role, employee_id } = req.body;

      const targetRole = role || roles || 'Employee';
      if (!VALID_ROLES.includes(targetRole)) {
        throw new ValidationError(`Invalid role: ${targetRole}. Valid roles: ${VALID_ROLES.join(', ')}`);
      }

      const passwordHash = await authService.hashPassword(password || 'password123');

      const user = await prisma.user.create({
        data: {
          organization_id: orgId,
          email,
          password_hash: passwordHash,
          role: targetRole,
          employee_id: employee_id || null,
        },
      });

      res.status(201).json({ id: user.id, email: user.email, role: user.role });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const { roles, role, status, password } = req.body;

      const updateData: any = {};
      if (roles || role) {
        const targetRole = role || roles;
        if (!VALID_ROLES.includes(targetRole)) {
          throw new ValidationError(`Invalid role: ${targetRole}. Valid roles: ${VALID_ROLES.join(', ')}`);
        }
        updateData.role = targetRole;
      }
      if (status) updateData.status = status;
      if (password) updateData.password_hash = await authService.hashPassword(password);

      const user = await prisma.user.updateMany({
        where: { id: req.params.id as string, organization_id: orgId },
        data: updateData,
      });

      if (user.count === 0) {
        throw new NotFoundError('User not found');
      }

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();
