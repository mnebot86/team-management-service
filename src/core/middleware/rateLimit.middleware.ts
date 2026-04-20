import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  return limiter(req, res, next);
};
