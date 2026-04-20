import dotenv from 'dotenv';

const envFileMap: Record<string, string> = {
  test: '.env.test',
  staging: '.env.staging',
  production: '.env.production',
  development: '.env.development',
};

const envFile = envFileMap[process.env.NODE_ENV || 'development'] || '.env.development';

dotenv.config({ path: envFile });

const requiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }

  return value;
};

export const env = {
  NODE_ENV:
    (process.env.NODE_ENV as 'development' | 'test' | 'production' | 'staging') || 'development',

  PORT: Number(process.env.PORT) || 5001,

  MONGO_URI: requiredEnv('MONGO_URI'),

  JWT_SECRET: requiredEnv('JWT_SECRET'),
};
