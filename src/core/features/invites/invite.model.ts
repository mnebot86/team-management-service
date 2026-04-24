import mongoose, { Schema, Document } from 'mongoose';

export interface IInvite extends Document {
  teamId: mongoose.Types.ObjectId;
  email: string;
  role: 'owner' | 'coach' | 'player';
  invitedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['owner', 'coach', 'player'],
      default: 'player',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// prevent duplicate active invites per email + team
InviteSchema.index({ teamId: 1, email: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

export const Invite = mongoose.model<IInvite>('Invite', InviteSchema);
