import { Types } from 'mongoose';

export interface CreateTeamDto {
  name: string;
  ageGroup: string;
  sport: string;
  sportId: string;
  sportVariantId: string;
  ownerId: Types.ObjectId;
}
