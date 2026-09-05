import { describe, it, expect, vi } from 'vitest';
import { UserService } from '../user.service';
import { ValidationError, NotFoundError } from '../../../shared/errors/app.error';

describe('UserService (Separation of Concerns & Business Logic)', () => {
  const mockRepo = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  };

  const mockAuth = {
    hashPassword: vi.fn().mockResolvedValue('hashed_pw_123'),
  };

  const service = new UserService(mockRepo as any, mockAuth as any);

  it('rejects invalid roles with ValidationError', async () => {
    await expect(
      service.createUser('org_1', {
        email: 'test@example.com',
        role: 'SuperHacker' as any,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('hashes password and creates user with default Employee role', async () => {
    mockRepo.findByEmail.mockResolvedValueOnce(null);
    mockRepo.create.mockResolvedValueOnce({
      id: 'usr_1',
      email: 'john@example.com',
      role: 'Employee',
    });

    const result = await service.createUser('org_1', {
      email: 'john@example.com',
      password: 'mypassword',
    });

    expect(mockAuth.hashPassword).toHaveBeenCalledWith('mypassword');
    expect(mockRepo.create).toHaveBeenCalledWith({
      organization_id: 'org_1',
      email: 'john@example.com',
      password_hash: 'hashed_pw_123',
      role: 'Employee',
      employee_id: null,
    });
    expect(result).toEqual({ id: 'usr_1', email: 'john@example.com', role: 'Employee' });
  });

  it('throws NotFoundError when user is not found by ID', async () => {
    mockRepo.findById.mockResolvedValueOnce(null);

    await expect(service.getUserById('org_1', 'nonexistent_id')).rejects.toThrow(NotFoundError);
  });

  it('formats and maps user DTOs cleanly in getAllUsers', async () => {
    mockRepo.findAll.mockResolvedValueOnce([
      {
        id: 'usr_1',
        email: 'alice@example.com',
        role: 'HR Manager',
        status: 'Active',
        employee_id: 'emp_1',
        employee: { first_name: 'Alice', last_name: 'Smith' },
        created_at: new Date('2026-01-01'),
      },
    ]);

    const users = await service.getAllUsers('org_1');
    expect(users).toHaveLength(1);
    expect(users[0].employee_name).toBe('Alice Smith');
    expect(users[0].email).toBe('alice@example.com');
  });

  it('blocks self-promotion attempt with ForbiddenError', async () => {
    const { ForbiddenError } = await import('../../../shared/errors/app.error');
    mockRepo.findById.mockResolvedValueOnce({
      id: 'usr_self',
      role: 'HR Payroll Admin',
    });

    await expect(
      service.updateUser('org_1', 'usr_self', { role: 'Admin' }, 'usr_self')
    ).rejects.toThrow(ForbiddenError);
  });
});
