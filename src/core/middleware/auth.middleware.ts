import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../shared/utils/response';
import { verifyAccessToken, JwtPayload } from '../auth/jwt';

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
    const decoded: JwtPayload = verifyAccessToken(token);

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
