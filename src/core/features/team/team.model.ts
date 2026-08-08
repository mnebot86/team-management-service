import { Schema, model } from 'mongoose';
import { ITeam } from './team.types';

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ageGroup: {
      type: String,
      trim: true,
    },
    sport: {
      type: String,
      default: 'football',
      trim: true,
    },
    sportId: {
      type: String,
      required: true,
      default: 'football',
      trim: true,
      index: true,
    },
    sportVariantId: {
      type: String,
      required: true,
      default: 'tackle-11',
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

teamSchema.index(
  { name: 1, ageGroup: 1, sportId: 1, sportVariantId: 1 },
  { unique: true }
);

export const Team = model<ITeam>('Team', teamSchema);
