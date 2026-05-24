import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import {
  getTeamMembers,
  getTeamsForProfile,
  updateTeamMemberRole,
  removeTeamMember,
  addTeamMember,
} from './teamMember.service';
import { Profile } from '../profile/profile.model';
import { AuthRequest } from '../team/team.types';
import { createProfile } from '../profile/profile.service';
import { sendError, sendSuccess } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';

// Helper to get the claimed profile for a user
const getProfileForUser = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  return Profile.findOne({ createdByUserId: userId, isClaimed: true });
};

export const getRoster = async (req: Request, res: Response) => {
  const teamId = req.params.teamId as string;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid team ID' });
  }

  try {
    const members = await getTeamMembers(new mongoose.Types.ObjectId(teamId));

    const modifiedMembers = members.map((member) => {
      const profile = member.profileId as unknown as {
        _id: Types.ObjectId;
        firstName: string;
        lastName: string;
        isClaimed: boolean;
        linkCode?: string;
      };

      return {
        profileId: profile._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: member.role,
        isClaimed: profile.isClaimed,
        linkCode: profile.linkCode,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      };
    });

    return sendSuccess(res, StatusCodes.OK, modifiedMembers, 'Team roster fetched successfully');
  } catch {
    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch the roster'
    );
  }
};

export const getMyTeams = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'User is unauthorized' });
  }

  try {
    const profile = await getProfileForUser(userId);
    if (!profile) {
      return res.status(StatusCodes.OK).json({ success: true, data: [] });
    }

    const memberships = await getTeamsForProfile(profile._id);
    const teams = memberships.map((m) => m.teamId);

    return res.status(StatusCodes.OK).json({ success: true, data: teams });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to fetch teams' });
  }
};

export const patchMemberRole = async (req: Request, res: Response) => {
  const teamId = req.params.teamId as string;
  const profileId = req.params.profileId as string;
  const { role } = req.body as { role?: 'owner' | 'coach' | 'player' };

  if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(profileId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid IDs' });
  }

  if (!role) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Role is required' });
  }

  try {
    const updated = await updateTeamMemberRole(
      new mongoose.Types.ObjectId(teamId),
      new mongoose.Types.ObjectId(profileId),
      role
    );

    if (!updated) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Team member not found' });
    }

    return res.status(StatusCodes.OK).json({ success: true, data: updated });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to update the team member role' });
  }
};

export const deleteMember = async (req: Request, res: Response) => {
  const teamId = req.params.teamId as string;
  const profileId = req.params.profileId as string;

  if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(profileId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid IDs' });
  }

  try {
    await removeTeamMember(
      new mongoose.Types.ObjectId(teamId),
      new mongoose.Types.ObjectId(profileId)
    );

    return res.status(StatusCodes.OK).json({ success: true, message: 'Member removed' });
  } catch {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to remove the team member' });
  }
};

export const addPlayerToRoster = async (req: AuthRequest, res: Response) => {
  let session: mongoose.ClientSession | null = null;

  const {
    body: {
      firstName,
      lastName,
    },
    params: { teamId },
    user,
  } = req;

  if (!firstName) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'First name is required');
  }

  if (!lastName) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Last name is required');
  }

  try {
    session = await mongoose.startSession();

    session.startTransaction();

    const newProfile = await createProfile(
      {
        firstName,
        lastName,
        createdByUserId: new Types.ObjectId(user?.id),
        isClaimed: false,
      },
      session
    );

    if (!newProfile) {
      return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while creating the profile');
    }

    const newMember = await addTeamMember(
      new Types.ObjectId(teamId as string),
      newProfile._id,
      'player',
      session
    );

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, StatusCodes.OK, newMember, 'New team member added successfully');
  } catch (error) {
    logger.error({ err: error }, 'Error adding player to roster');
    await session?.abortTransaction();

    session?.endSession();

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'An error occurred while adding the player to the roster'
    );
  }
};