import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import {
  getTeamMembers,
  addTeamMember,
  getTeamMembersCount,
  getTeamMemberById
} from './teamMember.service';
import { AuthRequest } from '../team/team.types';
import { uploadUserProfileImage } from '../imageUploader/imageUploader.service';
import { createProfile } from '../profile/profile.service';
import { sendError, sendSuccess } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';

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
        avatar?: {
          url: string;
          publicId: string;
        };
      };

      return {
        profileId: profile._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: member.role,
        isClaimed: profile.isClaimed,
        linkCode: profile.linkCode,
        imageUrl: profile.avatar?.url || null,
        jerseyNumber: member.jerseyNumber,
        positions: member.positions,
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

export const getRosterCount = async (req: AuthRequest, res: Response) => {
  const teamId = req.params.teamId as string;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid team ID' });
  }

  try {
    const count = await getTeamMembersCount(new mongoose.Types.ObjectId(teamId));

    console.log('Roster count:', count);

    return sendSuccess(res, StatusCodes.OK, { count }, 'Team roster count fetched successfully');
  } catch {
    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch the roster count'
    );
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

  if (!teamId || Array.isArray(teamId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid team ID');
  }

  try {
    session = await mongoose.startSession();

    session.startTransaction();

    let avatar;

    if (req.file) {
      avatar = await uploadUserProfileImage(req.file.path);
    }

    const payload: {
      firstName: string;
      lastName: string;
      createdByUserId: Types.ObjectId;
      isClaimed: boolean;
      avatar?: {
        url: string;
        publicId: string;
      };
    } = {
      firstName,
      lastName,
      createdByUserId: new Types.ObjectId(user!.id as string),
      isClaimed: false,
    };

    if (avatar) {
      payload.avatar = avatar;
    }

    const newProfile = await createProfile(
      payload,
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

export const getTeamMember = async (req: AuthRequest, res: Response) => {
  const teamId = req.params.teamId as string;
  const profileId = req.params.profileId as string;

  if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(profileId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid IDs' });
  }

  try {
    const member = await getTeamMemberById(teamId, profileId);

    if (!member) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Team member not found' });
    }

    const modifiedMember = {
      firstName: (member.profileId as any).firstName,
      lastName: (member.profileId as any).lastName,
      role: member.role,
      jerseyNumber: member.jerseyNumber,
      positions: member.positions,
      avatar: (member.profileId as any).avatar?.url || null,
      isClaimed: (member.profileId as any).isClaimed,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }

    return res.status(StatusCodes.OK).json({ success: true, data: modifiedMember });
  } catch (error) {
    logger.error({ teamId, profileId, error }, 'Error fetching team member');

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to fetch the team member' });
  }
};
