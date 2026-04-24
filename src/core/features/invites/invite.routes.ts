import { Router } from "express";
import * as inviteController from './invite.controller';

const router = Router();

router.post('/:teamId', inviteController.createInvite);
router.get('/', inviteController.getMyInvites);
router.post('/:inviteId/accept', inviteController.acceptInvite);

export default router;
