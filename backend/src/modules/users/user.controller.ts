import { Request, Response, NextFunction } from 'express';
import { userService, UserService } from './user.service';

export class UserController {
  constructor(private readonly service: UserService = userService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const users = await this.service.getAllUsers(orgId);
      res.json(users);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.createUser(orgId, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.updateUser(orgId, req.params.id as string, req.body, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();
