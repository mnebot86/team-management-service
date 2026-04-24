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
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'coach', 'player'],
          default: 'player',
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

teamSchema.index(
  { name: 1, ageGroup: 1, sport: 1 },
  { unique: true }
);

export const Team = model<ITeam>('Team', teamSchema);
