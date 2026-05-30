import { Schema, model, Types, Document } from 'mongoose';

export interface ProfileDocument extends Document {
  firstName: string;
  lastName?: string;
  createdByUserId: Types.ObjectId;
  isClaimed: boolean;
  createdAt: Date;
  updatedAt: Date;
  linkCode: string;
  avatar?: {
    url: string;
    publicId: string;
  };
}

const profileSchema = new Schema<ProfileDocument>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    avatar: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isClaimed: {
      type: Boolean,
      default: false,
    },
    linkCode: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Profile = model<ProfileDocument>('Profile', profileSchema);
