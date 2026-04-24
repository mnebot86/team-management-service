import { Router } from "express";
import * as inviteController from './invite.controller';
import { requireTeamPermission } from '../../middleware/permissions.middleware';
import { canManageMembers } from '../team/team.permissions';

const router = Router();

router.post(
  '/:teamId',
  requireTeamPermission(canManageMembers),
  inviteController.createInvite
);
router.get('/', inviteController.getMyInvites);
router.post('/:inviteId/accept', inviteController.acceptInvite);

export default router;
