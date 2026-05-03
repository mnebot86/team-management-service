import { Router } from 'express';
import * as authController from './auth.controller';
import { authLimiter } from '../../middleware/rateLimit.middleware';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', protect, authController.getMe);

export default router;
