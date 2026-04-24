import { Router } from 'express';
import * as teamController from './team.controller';
import { requireTeamPermission } from '../../middleware/permissions.middleware';
import { canUpdateTeam, canDeleteTeam, canManageMembers } from './team.permissions';

const router = Router();

router.post('/', teamController.createTeam);
router.get('/', teamController.getTeams);
router.get('/:teamId', teamController.getTeam);
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

router.post(
  '/:teamId/members',
  requireTeamPermission(canManageMembers),
  teamController.addTeamMember
);
router.delete(
  '/:teamId/members/:userId',
  requireTeamPermission(canManageMembers),
  teamController.removeTeamMember
);

export default router;
