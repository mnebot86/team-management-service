import mongoose, { Schema, Types, Document } from 'mongoose';

export type UserProfileRole = 'player' | 'coach';

export interface UserProfile {
  userId: Types.ObjectId;
  profileId: Types.ObjectId | string;
  role: UserProfileRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserProfileDocument = UserProfile & Document;

const userProfileSchema = new Schema<UserProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
      enum: ['player', 'coach'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userProfileSchema.index({ userId: 1, profileId: 1 }, { unique: true });

export const UserProfile = mongoose.model<UserProfileDocument>(
  'UserProfile',
  userProfileSchema
);
