import { env } from "../../config/env";
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../shared/utils/response';

type JwtPayload = {
  userId: string;
  email: string;
  profileId?: string
};

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    profileId?: string
  };
}

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      res,
      StatusCodes.UNAUTHORIZED,
      'Not authorized, no token'
    );
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return sendError(
      res,
      StatusCodes.UNAUTHORIZED,
      'Not authorized, token missing'
    );
  }

  try {
    if (!env.JWT_SECRET) {
      return sendError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'JWT secret not configured'
      );
    }

    const decoded = jwt.verify(
      token,
      env.JWT_SECRET
    ) as unknown as JwtPayload;

    (req as AuthRequest).user = {
      id: decoded.userId,
      email: decoded.email,
      ...(decoded.profileId ? { profileId: decoded.profileId } : {}),
    };

    next();
  } catch {
    return sendError(
      res,
      StatusCodes.UNAUTHORIZED,
      'Not authorized, invalid token'
    );
  }
};
