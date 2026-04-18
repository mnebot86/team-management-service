import { Router } from 'express';
import * as teamController from './team.controller';

const router = Router();

router.post('/', teamController.createTeam);
router.get('/', teamController.getTeams);
router.get('/:teamId', teamController.getTeam);

export default router;
