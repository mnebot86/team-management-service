import { Router } from 'express';
import { upload } from '../../middleware/upload.middleware';
import {
  createProfileForUserHandler,
  createProfileByCoachHandler,
  getProfilesByCreatorHandler,
  getProfileByIdHandler,
  linkProfileHandler,
  searchProfilesHandler,
} from './profile.controller';

const router = Router();

router.post('/', upload.single('avatar'), createProfileForUserHandler);
router.post('/coach', upload.single('avatar'), createProfileByCoachHandler);
router.get('/', getProfilesByCreatorHandler);
router.get('/:id', getProfileByIdHandler);
router.post('/link', linkProfileHandler);
router.get('/search', searchProfilesHandler);

export default router;
