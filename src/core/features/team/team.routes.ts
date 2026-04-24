import { Router } from 'express';
import * as teamController from './team.controller';

const router = Router();

router.post('/', teamController.createTeam);
router.get('/', teamController.getTeams);
router.get('/:teamId', teamController.getTeam);
router.patch('/:teamId', teamController.updateTeam);
router.delete('/:teamId', teamController.deleteTeam);

router.post('/:teamId/members', teamController.addTeamMember);
router.delete('/:teamId/members/:userId', teamController.removeTeamMember);

export default router;
