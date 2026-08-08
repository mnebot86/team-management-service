import { Router } from 'express';

import {
  createDeptChartController,
  deleteDeptChartController,
  getDeptChartFiltersController,
  getDeptChartsController,
  updateDeptChartController,
} from './deptChart.controller';

const router = Router();

router.get('/:teamId/filters', getDeptChartFiltersController);
router.get('/:teamId', getDeptChartsController);
router.post('/:teamId', createDeptChartController);
router.patch('/:deptChartId', updateDeptChartController);
router.delete('/:deptChartId', deleteDeptChartController);

export default router;
