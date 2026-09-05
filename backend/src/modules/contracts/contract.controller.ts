import { Request, Response, NextFunction } from 'express';
import { contractService, ContractService } from './contract.service';
import { ForbiddenError, NotFoundError } from '../../shared/errors/app.error';

export class ContractController {
  constructor(private readonly service: ContractService = contractService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const contracts = await this.service.getAllContracts(orgId);

      // If regular Employee, only return their own contracts
      if (req.user?.role === 'Employee') {
        const myContracts = contracts.filter((c: any) => c.employee_id === req.user?.employeeId);
        res.json(myContracts);
        return;
      }

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

      // Check ownership if caller is an Employee
      if (req.user?.role === 'Employee' && contract.employee_id !== req.user?.employeeId) {
        throw new ForbiddenError('You are not authorized to view this contract');
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
