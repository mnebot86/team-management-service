import { Schema, model, Types, Document } from 'mongoose';

export const TEAM_ROLES = {
  COACH: 'coach',
  PLAYER: 'player',
  PARENT: 'parent',
} as const;

export type TeamRole = typeof TEAM_ROLES[keyof typeof TEAM_ROLES];

export interface TeamMemberDocument extends Document {
  teamId: Types.ObjectId;
  profileId: Types.ObjectId;
  role: TeamRole;
  jerseyNumber?: string;
  positions?: string[];
  positionIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const teamMemberSchema = new Schema<TeamMemberDocument>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['coach', 'player', 'parent'],
      required: true,
    },
    jerseyNumber: {
      type: String,
      required: false,
    },
    positions: {
      type: [String],
      required: false,
    },
    positionIds: {
      type: [String],
      required: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

teamMemberSchema.index({ teamId: 1, profileId: 1 }, { unique: true });

export const TeamMember = model<TeamMemberDocument>('TeamMember', teamMemberSchema);
