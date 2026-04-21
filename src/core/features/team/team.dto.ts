import { Types } from 'mongoose';

export interface CreateTeamDto {
  name: string;
  ageGroup: string;
  sport: string;
  ownerId: Types.ObjectId;
}
