import express from 'express';
import cors from 'cors';
import { logger } from './core/shared/utils/logger';

// routes
// import teamRoutes from './features/team/team.routes';

// middleware
import { errorMiddleware } from './core/middleware/error.middleware';

const app = express();

// global middleware
app.use(cors());
app.use(express.json());

// health check route
app.get('/health', (_req, res) => {
  logger.info('🔥 /health hit');
  res.status(200).json({ status: 'OK' });
});

// feature routes (uncomment when ready)
// app.use('/api/teams', teamRoutes);

// error handler (must be last)
app.use(errorMiddleware);

export default app;
