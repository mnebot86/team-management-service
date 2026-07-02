import { logger } from './core/shared/utils/logger';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const { PORT } = env;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to start server');
    process.exit(1);
  }
};

startServer();
