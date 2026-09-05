import { Request, Response, NextFunction } from 'express';
import { contractService, ContractService } from './contract.service';
import { ForbiddenError, NotFoundError } from '../../shared/errors/app.error';

export class ContractController {
  constructor(private readonly service: ContractService = contractService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager' || req.user?.role === 'HR Payroll Admin' || req.user?.role === 'HR Payroll User';

      // If not privileged, strictly restrict query to caller's own employee ID at the DB layer
      if (!isPrivileged) {
        if (!req.user?.employeeId) {
          res.json([]);
          return;
        }
        const myContracts = await this.service.getAllContracts(orgId, req.user.employeeId);
        res.json(myContracts);
        return;
      }

      const contracts = await this.service.getAllContracts(orgId);
      res.json(contracts);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const contract = await this.service.getContractById(orgId, req.params.id as string);
      if (!contract) {
        throw new NotFoundError('Contract not found');
      }

      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager' || req.user?.role === 'HR Payroll Admin' || req.user?.role === 'HR Payroll User';
      if (!isPrivileged && contract.employee_id !== req.user?.employeeId) {
        throw new ForbiddenError('You are not authorized to view another employee\'s contract');
      }

      res.json(contract);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const contract = await this.service.createContract(orgId, req.body, req.user?.id);
      res.status(201).json(contract);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const contract = await this.service.updateContract(orgId, req.params.id as string, req.body, req.user?.id);
      res.json(contract);
    } catch (err) {
      next(err);
    }
  };
}

export const contractController = new ContractController();
