import { Router } from 'express';
import {
  createPracticePlanController,
  getPracticePlansByTeamIdController,
  updatePracticePlanController,
} from './practice.controller';

const router = Router();

router.get('/:teamId', getPracticePlansByTeamIdController);
router.post('/:teamId', createPracticePlanController);
router.patch('/:planId', updatePracticePlanController);

export default router;
