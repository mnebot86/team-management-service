import { Router } from 'express';
import {
  createSchedule,
  getTeamSchedule,
  getNextPractice,
  getNextGame,
  updateAttendance,
} from './schedule.controller';

const router = Router();

router.get('/team/:teamId/next-practice', getNextPractice);
router.get('/team/:teamId/next-game', getNextGame);
router.get('/team/:teamId', getTeamSchedule);
router.patch('/:scheduleId/attendance', updateAttendance);
router.post('/', createSchedule);

export default router;
