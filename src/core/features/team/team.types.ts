import { Types } from 'mongoose';
import { Request } from 'express';

export interface ITeam {
  name: string;
  ageGroup?: string;
  sport?: string;
  sportId: string;
  sportVariantId: string;
  ownerId: Types.ObjectId;
  members?: {
    userId: Types.ObjectId;
    role: 'coach' | 'player' | 'parent';
  }[];
  active: boolean;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    profileId?: string;
  };
  team?: ITeam;
}
