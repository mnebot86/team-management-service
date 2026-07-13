import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  profileId?: string;
}

export const verifyAccessToken = (token: string): JwtPayload => {
  if (!env.JWT_SECRET) {
    throw new Error('JWT secret not configured.');
  }

  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
