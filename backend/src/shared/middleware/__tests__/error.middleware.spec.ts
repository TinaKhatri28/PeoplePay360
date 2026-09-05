import { describe, it, expect, vi } from 'vitest';
import { errorMiddleware } from '../error.middleware';

describe('errorMiddleware - Prisma Error Mapping', () => {
  const createMockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const req: any = {
    originalUrl: '/api/test',
    method: 'POST',
    requestId: 'req_test_123',
  };
  const next = vi.fn();

  it('maps Prisma P2002 unique constraint error to HTTP 409 Conflict', () => {
    const res = createMockRes();
    const prismaError = {
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
      meta: { target: ['email'] },
      message: 'Unique constraint failed on the fields: (`email`)',
    };

    errorMiddleware(prismaError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'CONFLICT',
          message: expect.stringContaining('email'),
        }),
      })
    );
  });

  it('maps Prisma P2025 record not found error to HTTP 404 Not Found', () => {
    const res = createMockRes();
    const prismaError = {
      name: 'PrismaClientKnownRequestError',
      code: 'P2025',
      meta: { cause: 'Record to update not found.' },
      message: 'An operation failed because it depends on one or more records that were required but not found.',
    };

    errorMiddleware(prismaError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
        }),
      })
    );
  });
});
