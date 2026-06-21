import bcrypt from 'bcrypt';
import { User } from '../user/user.model';
import { UserProfile } from '../userProfile/userProfile.model';
import { RegisterInput } from './auth.types';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../..//config/env';
import { emailService } from '../../../shared/email/email.service';

type AuthInput = {
  email: string;
  password: string;
};

type ForgotPasswordInput = {
  email: string;
};

type ResetPasswordInput = {
  token: string;
  password: string;
};

const SALT_ROUNDS = 10;

export const generateToken = (userId: string, email: string, profileId?: string) => {
  return jwt.sign(
    { userId, email, profileId },
    env.JWT_SECRET!,
    { expiresIn: '1d' }
  );
};

export const register = async ({ email, password }: RegisterInput) => {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    email,
    password: hashedPassword,
  });

  const token = generateToken(user._id.toString(), user.email);

  return {
    user: {
      _id: user._id,
      email: user.email,
    },
    token,
  };
};

export const login = async ({ email, password }: AuthInput) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const userProfile = await UserProfile.findOne({ userId: user._id });

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  let token

  if (userProfile) {
    token = generateToken(user._id.toString(), user.email, userProfile.profileId.toString());
  } else {
    token = generateToken(user._id.toString(), user.email);
  }

  return {
    user: {
      _id: user._id,
      email: user.email,
    },
    token,
  };
};

export const forgotPassword = async ({ email }: ForgotPasswordInput) => {
  const user = await User.findOne({ email });

  if (!user) {
    return;
  }

  const resetPasswordToken = crypto.randomBytes(32).toString('hex');

  const resetPasswordExpiresAt = new Date(
    Date.now() + (60 * 60 * 1000),
  );

  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordExpiresAt = resetPasswordExpiresAt;

  await user.save();

  const resetUrl =
    `${env.APP_URL}reset-password?token=${resetPasswordToken}`;

  await emailService.sendForgotPasswordEmail(
    user.email,
    resetUrl,
  );
};

export const resetPassword = async ({
  token,
  password,
}: ResetPasswordInput) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiresAt: {
      $gt: new Date(),
    },
  });

  if (!user) {
    throw new Error('INVALID_OR_EXPIRED_TOKEN');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  user.password = hashedPassword;

  user.set({
    resetPasswordToken: undefined,
    resetPasswordExpiresAt: undefined,
  });

  await user.save();
};
