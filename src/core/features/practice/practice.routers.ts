import { Router } from 'express';
import {
  createPracticePlanController,
  deletePracticePlanController,
  getPracticePlansByTeamIdController,
  updatePracticePlanController,
} from './practice.controller';

const router = Router();

router.get('/:teamId', getPracticePlansByTeamIdController);
router.post('/:teamId', createPracticePlanController);
router.patch('/:planId', updatePracticePlanController);
router.delete('/:planId', deletePracticePlanController);

export default router;
