import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './core/shared/utils/logger';

// routes
import authRoutes from './core/features/auth/auth.routers';
import teamRoutes from './core/features/team/team.routes'
import teamMember from './core/features/teamMember/teamMember.routers';
import inviteRoutes from './core/features/invites/invite.routes';
import profileRoutes from './core/features/profile/profile.routers';

// middleware
import { errorMiddleware } from './core/middleware/error.middleware';
import { protect } from './core/middleware/auth.middleware';

const app = express();

// global middleware
app.use(helmet())
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// request logging
app.use(
  morgan(':method :url :status :response-time ms', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
    skip: (req) => req.url === '/health',
  })
);

// health check route
app.get('/health', (_req, res) => {
  logger.info('🔥 /health hit');
  res.status(200).json({ status: 'OK' });
});

// feature routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/teams', protect, teamRoutes);
app.use('/api/v1/team-members', protect, teamMember);
app.use('/api/v1/invites', protect, inviteRoutes);
app.use('/api/v1/profiles', protect, profileRoutes);

// error handler (must be last)
app.use(errorMiddleware);

export default app;
