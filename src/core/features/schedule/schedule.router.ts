import { Router } from 'express';
import { createSchedule, getTeamSchedule } from './schedule.controller';

const router = Router();

router.get('/team/:teamId', getTeamSchedule);
router.post('/', createSchedule);

export default router;
