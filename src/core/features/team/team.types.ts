import { Types } from 'mongoose';
import { Request } from 'express';

export interface ITeam {
  name: string;
  ageGroup?: string;
  sport?: string;
  ownerId: Types.ObjectId;
  members?: {
    userId: Types.ObjectId;
    role: 'owner' | 'coach' | 'player';
  }[];
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  team?: ITeam;
}
