import { Response } from 'express';
import mongoose, { Types } from 'mongoose';
import {
  createProfileForUser,
  createProfileByCoach,
  getProfilesByCreator,
  getProfileById,
  linkProfileToUser,
  searchProfilesByName,
} from './profile.service';
import { AuthRequest } from '../team/team.types';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { createUserProfile } from '../userProfile/userProfile.service';

const toObjectId = (id: string) => new Types.ObjectId(id);

export const createProfileForUserHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const { firstName, lastName } = req.body;

  if (!firstName) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'First name is required');
  }

  try {
    const userId = toObjectId(req.user.id);

    const profile = await createProfileForUser(
      userId,
      firstName.trim(),
      lastName?.trim()
    );

    await createUserProfile({
      userId: new mongoose.Types.ObjectId(req.user.id),
      profileId: profile._id,
      role: 'player',
    });

    return sendSuccess(res, StatusCodes.CREATED, profile, 'Profile created successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create profile', error);
  }
};

export const createProfileByCoachHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const { firstName, lastName } = req.body;

  if (!firstName) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'First name is required');
  }

  try {
    const coachUserId = toObjectId(req.user.id);

    const profile = await createProfileByCoach(
      coachUserId,
      firstName.trim(),
      lastName?.trim()
    );

    return sendSuccess(res, StatusCodes.CREATED, profile, 'Profile created successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create profile', error);
  }
};

export const getProfilesByCreatorHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  try {
    const userId = toObjectId(req.user.id);
    const profiles = await getProfilesByCreator(userId);

    return sendSuccess(res, StatusCodes.OK, profiles, 'Profiles fetched successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch profiles', error);
  }
};

export const getProfileByIdHandler = async (req: AuthRequest, res: Response) => {
  const idParam = req.params.id;

  if (!idParam || Array.isArray(idParam)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Profile Id is required');
  }

  const id = idParam;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Profile Id');
  }

  try {
    const profileId = toObjectId(id);
    const profile = await getProfileById(profileId);

    if (!profile) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Profile not found');
    }

    return sendSuccess(res, StatusCodes.OK, profile, 'Profile fetched successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch profile', error);
  }
};

export const linkProfileHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const { linkCode } = req.body;

  if (!linkCode) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Link code is required');
  }

  try {
    const userId = toObjectId(req.user.id);
    const profile = await linkProfileToUser(userId, linkCode);

    if (!profile) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Invalid link code');
    }

    return sendSuccess(res, StatusCodes.OK, profile, 'Profile linked successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to link profile', error);
  }
};

export const searchProfilesHandler = async (req: AuthRequest, res: Response) => {
  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Name query is required');
  }

  try {
    const results = await searchProfilesByName(name);

    return sendSuccess(res, StatusCodes.OK, results, 'Profiles fetched successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Search failed', error);
  }
};
