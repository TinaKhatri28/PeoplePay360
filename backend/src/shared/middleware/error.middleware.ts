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
