import { Response } from 'express';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import {
  createUserProfile,
  getProfilesForUser,
  getUsersForProfile,
  deleteUserProfile,
} from './userProfile.service';

import { sendSuccess, sendError } from '../../shared/utils/response';
import { AuthRequest } from '../team/team.types';

export const createUserProfileHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const { profileId, role } = req.body;

  if (!profileId) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Profile Id is required');
  }

  if (!mongoose.Types.ObjectId.isValid(profileId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Profile Id');
  }

  if (!role) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Role is required');
  }

  try {
    const profile = await createUserProfile({
      userId: new mongoose.Types.ObjectId(req.user.id),
      profileId: new mongoose.Types.ObjectId(profileId),
      role,
    });

    return sendSuccess(res, StatusCodes.CREATED, profile, 'UserProfile created successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create user profile', error);
  }
};

export const getProfilesForUserHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  try {
    const profiles = await getProfilesForUser(
      new mongoose.Types.ObjectId(req.user.id)
    );

    return sendSuccess(res, StatusCodes.OK, profiles, 'Profiles fetched successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch profiles', error);
  }
};

export const getUsersForProfileHandler = async (req: AuthRequest, res: Response) => {
  const profileIdParam = req.params.profileId;

  if (!profileIdParam || Array.isArray(profileIdParam)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Profile Id is required');
  }

  if (!mongoose.Types.ObjectId.isValid(profileIdParam)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Profile Id');
  }

  try {
    const users = await getUsersForProfile(
      new mongoose.Types.ObjectId(profileIdParam)
    );

    return sendSuccess(res, StatusCodes.OK, users, 'Users fetched successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch users', error);
  }
};

export const deleteUserProfileHandler = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const { profileId } = req.body;

  if (!profileId) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Profile Id is required');
  }

  if (!mongoose.Types.ObjectId.isValid(profileId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Profile Id');
  }

  try {
    await deleteUserProfile(
      new mongoose.Types.ObjectId(req.user.id),
      new mongoose.Types.ObjectId(profileId)
    );

    return sendSuccess(res, StatusCodes.OK, null, 'UserProfile deleted successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete user profile', error);
  }
};
