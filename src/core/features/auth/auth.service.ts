import bcrypt from 'bcrypt';
import { User } from '../user/user.model';
import { RegisterInput } from './auth.types';
import jwt from 'jsonwebtoken';
import { env } from '../../..//config/env';

type AuthInput = {
  email: string;
  password: string;
};

const SALT_ROUNDS = 10;

export const generateToken = (userId: string, email: string) => {
  return jwt.sign(
    { userId, email },
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

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const token = generateToken(user._id.toString(), user.email);

  return {
    user: {
      _id: user._id,
      email: user.email,
    },
    token,
  };
};
