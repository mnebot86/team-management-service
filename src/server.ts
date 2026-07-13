import app from './app';
import { connectDB } from './config/db';
import { createServer } from 'http';
import { logger } from './core/shared/utils/logger';
import { env } from './config/env';
import { initializeSocket } from './core/socket';

const { PORT } = env;

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = createServer(app);

    initializeSocket(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to start server');
    process.exit(1);
  }
};

startServer();
