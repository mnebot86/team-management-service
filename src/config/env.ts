import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }

  return value;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  PORT: Number(process.env.PORT) || 5001,

  MONGO_URI: requiredEnv('MONGO_URI'),
};
