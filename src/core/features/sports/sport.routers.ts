import { Router } from 'express';

import { getSportDefinition, listSports } from './sport.controller';

const router = Router();

router.get('/', listSports);
router.get('/:sportId', getSportDefinition);

export default router;
