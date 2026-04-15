import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../core/shared/utils/logger';

export const connectDB = async () => {
  try {
    const mongoURI = env.MONGO_URI;

    await mongoose.connect(mongoURI);

    logger.info('✅ MongoDB connected');
  } catch (error) {
    logger.error({ err: error }, '❌ MongoDB connection error');
    process.exit(1);
  }
};
