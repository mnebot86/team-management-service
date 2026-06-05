import { Router } from 'express';
import * as teamMemberController from './teamMember.controller';

import { upload } from '../../middleware/upload.middleware';


const router = Router();

router.post(
  '/:teamId',
  upload.single('avatar'),
  teamMemberController.addPlayerToRoster,
);
router.get('/:teamId', teamMemberController.getRoster);
router.get('/:teamId/count', teamMemberController.getRosterCount);
router.get('/:teamId/member/:profileId', teamMemberController.getTeamMember);

router.patch(
  '/:teamId/member/:profileId',
  upload.single('avatar'),
  teamMemberController.editTeamMember,
);

export default router;
