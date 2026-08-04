import { Schema, model } from 'mongoose';
import { TEAM_ROLES } from '../teamMember/teamMember.modal';
import { ITeamInvite } from './types';

const teamInviteSchema = new Schema<ITeamInvite>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(TEAM_ROLES),
      required: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    maxUses: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

teamInviteSchema.index({
  teamId: 1,
  role: 1,
  active: 1,
  expiresAt: 1,
});

export const Invite = model<ITeamInvite>('Invite', teamInviteSchema);
