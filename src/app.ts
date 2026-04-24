import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './core/shared/utils/logger';

// routes
import authRoutes from './core/features/auth/auth.routers';
import teamRoutes from './core/features/team/team.routes'
import inviteRoutes from './core/features/invites/invite.routes';

// middleware
import { errorMiddleware } from './core/middleware/error.middleware';
import { protect } from './core/middleware/auth.middleware';

const app = express();

// global middleware
app.use(helmet())
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// health check route
app.get('/health', (_req, res) => {
  logger.info('🔥 /health hit');
  res.status(200).json({ status: 'OK' });
});

// feature routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/teams', protect, teamRoutes);
app.use('/api/v1/invites', protect, inviteRoutes);

// error handler (must be last)
app.use(errorMiddleware);

export default app;
