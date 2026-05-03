import { Schema, model, Types, Document } from 'mongoose';

export type TeamRole = 'owner' | 'coach' | 'player';

export interface TeamMemberDocument extends Document {
  teamId: Types.ObjectId;
  profileId: Types.ObjectId;
  role: TeamRole;
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
      enum: ['owner', 'coach', 'player'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

teamMemberSchema.index({ teamId: 1, profileId: 1 }, { unique: true });

export const TeamMember = model<TeamMemberDocument>('TeamMember', teamMemberSchema);
