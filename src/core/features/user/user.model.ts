import { Schema, model } from 'mongoose';
import { IUser } from './user.types';

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    resetPasswordToken: {
      type: String,
      required: false,
      trim: true,
    },
    resetPasswordExpiresAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>('User', userSchema);
