import { Types } from 'mongoose';
import { Request } from 'express';

export interface ITeam {
  name: string;
  ageGroup?: string;
  sport?: string;
  ownerId: Types.ObjectId;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}
