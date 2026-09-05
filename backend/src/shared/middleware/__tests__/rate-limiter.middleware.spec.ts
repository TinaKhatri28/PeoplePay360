import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from '../rate-limiter.middleware';

describe('createRateLimiter - Sliding Window Rate Limiting', () => {
  let limiter: any;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Set to production to enable rate limiting logic during test
    process.env.NODE_ENV = 'production';
    limiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 2,
      message: 'Rate limit exceeded',
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  const createMockReq = (ip = '192.168.1.100') => ({
    ip,
    baseUrl: '/api/auth',
    path: '/login',
    originalUrl: '/api/auth/login',
    socket: { remoteAddress: ip },
    requestId: 'req_123',
  });

  const createMockRes = () => {
    const res: any = {};
    res.setHeader = vi.fn();
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  it('allows requests within limit and sets rate limit headers', () => {
    const req = createMockReq('10.0.0.1');
    const res = createMockRes();
    const next = vi.fn();

    limiter(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 2);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 1);
  });

  it('blocks request with HTTP 429 when max threshold is exceeded', () => {
    const req = createMockReq('10.0.0.2');
    const next = vi.fn();

    // Call 1: Allowed
    limiter(req, createMockRes(), next);
    // Call 2: Allowed
    limiter(req, createMockRes(), next);

    // Call 3: Exceeded -> HTTP 429
    const res3 = createMockRes();
    limiter(req, res3, next);

    expect(res3.status).toHaveBeenCalledWith(429);
    expect(res3.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'TOO_MANY_REQUESTS',
        }),
      })
    );
  });
});
