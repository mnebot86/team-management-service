import { Response } from 'express';

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: unknown;
};

// ✅ Success response
export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  data?: T,
  message?: string,
) => {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  });
};

// ❌ Error response
export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  error?: unknown,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && error ? { error } : {}),
  });
};
