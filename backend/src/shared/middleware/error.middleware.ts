import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app.error';
import { logger } from '../logger/logger';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.requestId || 'unknown';

  if (err instanceof AppError) {
    logger.warn({
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      path: req.originalUrl,
      method: req.method,
    }, `AppError: ${err.message}`);

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      requestId,
    });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    logger.warn({
      requestId,
      code: 'VALIDATION_ERROR',
      details,
      path: req.originalUrl,
      method: req.method,
    }, 'Validation error occurred');

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details,
      },
      requestId,
    });
    return;
  }

  // Prisma Known Request Error Mapping (P2002: Unique constraint, P2025: Record not found)
  if (err.name === 'PrismaClientKnownRequestError' || err.code?.startsWith?.('P')) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target || 'field';
      logger.warn({ requestId, code: 'CONFLICT', target, path: req.originalUrl }, 'Prisma unique constraint conflict');
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `A resource with this ${target} already exists.`,
          details: err.meta,
        },
        requestId,
      });
      return;
    }

    if (err.code === 'P2025') {
      logger.warn({ requestId, code: 'NOT_FOUND', path: req.originalUrl }, 'Prisma record not found');
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
          details: err.meta,
        },
        requestId,
      });
      return;
    }
  }

  // Unhandled / Internal Server Error
  logger.error({
    requestId,
    err: {
      message: err.message,
      stack: err.stack,
    },
    path: req.originalUrl,
    method: req.method,
  }, 'Unhandled internal server error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred. Please try again later.' 
        : err.message || 'Internal server error',
    },
    requestId,
  });
};
