import { Router } from "express";
import * as inviteCodeController from './invite.controller';

const router = Router();

router.patch('/:codeId/toggle', inviteCodeController.toggleCodeStatus);

export default router;
