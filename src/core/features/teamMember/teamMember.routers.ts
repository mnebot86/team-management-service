import { Router } from 'express';
import * as teamMemberController from './teamMember.controller';


const router = Router();

router.post('/:teamId', teamMemberController.addPlayerToRoster);
router.get('/:teamId', teamMemberController.getRoster);


export default router;
