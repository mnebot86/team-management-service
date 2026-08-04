import { Team } from "./../team/team.model";
import { Types } from 'mongoose';
import { TeamRole } from '../teamMember/teamMember.modal';

export interface ITeamInvite {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  role: TeamRole;
  code: string;
  active: boolean;
  maxUses: number;
  usedCount: number;
  lastUsedAt: Date;
  expiresAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreateInvitePayload {
  teamId: string;
  role: TeamRole;
  createdBy: string;
  maxUses?: number;
  expiresAt?: Date | null;
}
