import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/utils/logger';

type AppError = {
  statusCode?: number;
  message: string;
  stack?: string;
};

export const errorMiddleware = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const statusCode = err.statusCode || 500;

  logger.error({ err }, '❌ Error');

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
