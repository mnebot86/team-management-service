import { Router } from 'express';
import * as teamController from './team.controller';

const router = Router();

router.post('/', teamController.createTeam);

export default router;
