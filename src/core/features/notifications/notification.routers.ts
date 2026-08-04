import { Router } from 'express';

import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from './notification.controller';

const router = Router();

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:notificationId/read', markRead);

export default router;
