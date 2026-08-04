import { Router } from 'express';
import * as teamController from './team.controller';
import * as inviteController from '../invites/invite.controller';
import { requireTeamPermission } from '../../middleware/permissions.middleware';
import { canUpdateTeam, canDeleteTeam } from './team.permissions';

const router = Router();

router.post('/', teamController.createTeam);

router.get('/', teamController.getTeams);
router.get('/:teamId', teamController.getTeam);
router.get('/active-team-count', teamController.getActiveTeamsCount);

router.patch(
  '/:teamId',
  requireTeamPermission(canUpdateTeam),
  teamController.updateTeam
);
router.delete(
  '/:teamId',
  requireTeamPermission(canDeleteTeam),
  teamController.deleteTeam
);

// Invites Routes
router.post('/:teamId/invites', inviteController.createInviteCode);
router.get('/:teamId/invites', inviteController.getVisitCodes);
router.post('/join', inviteController.joinTeam);

export default router;
