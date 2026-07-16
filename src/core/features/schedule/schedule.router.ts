import { Router } from 'express';
import {
  createSchedule,
  getTeamSchedule,
  getNextPractice,
  getNextGame,
  updateAttendance,
  getLastPractice,
  getPlayerAttendance,
} from './schedule.controller';

const router = Router();

router.get('/team/:teamId/next-practice', getNextPractice);
router.get('/team/:teamId/last-practice', getLastPractice);
router.get('/player/:profileId/attendance', getPlayerAttendance);
router.get('/team/:teamId/next-game', getNextGame);
router.get('/team/:teamId', getTeamSchedule);
router.patch('/:scheduleId/attendance', updateAttendance);
router.post('/', createSchedule);

export default router;
