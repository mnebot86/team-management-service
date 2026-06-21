import { Router } from 'express';
import * as authController from './auth.controller';
import { authLimiter } from '../../middleware/rateLimit.middleware';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.get('/me', protect, authController.getMe);

export default router;
