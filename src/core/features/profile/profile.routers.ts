import { Router } from 'express';
import {
  createProfileForUserHandler,
  createProfileByCoachHandler,
  getProfilesByCreatorHandler,
  getProfileByIdHandler,
  linkProfileHandler,
  searchProfilesHandler,
} from './profile.controller';

const router = Router();

router.post('/', createProfileForUserHandler);
router.post('/coach', createProfileByCoachHandler);
router.get('/', getProfilesByCreatorHandler);
router.get('/:id', getProfileByIdHandler);
router.post('/link', linkProfileHandler);
router.get('/search', searchProfilesHandler);

export default router;
