import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './core/shared/utils/logger';

// routes
import authRoutes from './core/features/auth/auth.routers';
import inviteRoutes from './core/features/invites/routers'
import teamRoutes from './core/features/team/team.routers'
import teamMember from './core/features/teamMember/teamMember.routers';
import profileRoutes from './core/features/profile/profile.routers';
import scheduleRoutes from './core/features/schedule/schedule.router';
import practiceRoutes from './core/features/practice/practice.routers';
import notificationRoutes from './core/features/notifications/notification.routers';
import deptChartRoutes from './core/features/deptChart/deptChart.routers';

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
app.use('/api/v1/invites', inviteRoutes);
app.use('/api/v1/teams', protect, teamRoutes);
app.use('/api/v1/team-members', protect, teamMember);
app.use('/api/v1/profiles', protect, profileRoutes);
app.use('/api/v1/schedules', protect, scheduleRoutes);
app.use('/api/v1/practices', protect, practiceRoutes);
app.use('/api/v1/notifications', protect, notificationRoutes);
app.use('/api/v1/dept-charts', protect, deptChartRoutes);

// error handler (must be last)
app.use(errorMiddleware);

export default app;
