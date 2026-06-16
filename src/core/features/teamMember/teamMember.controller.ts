import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import {
  getTeamMembers,
  addTeamMember,
  getTeamMembersCount,
  getTeamMemberById,
  updateTeamMember
} from './teamMember.service';
import { AuthRequest } from '../team/team.types';
import { uploadUserProfileImage } from '../imageUploader/imageUploader.service';
import { createProfile, updateProfile } from '../profile/profile.service';
import { sendError, sendSuccess } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';

export const getRoster = async (req: Request, res: Response) => {
  const teamId = req.params.teamId as string;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid team ID' });
  }

  try {
    const members = await getTeamMembers(new mongoose.Types.ObjectId(teamId));

    const modifiedMembers = members
      .map((member) => {
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
      })
      .sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName);

        if (lastNameCompare !== 0) {
          return lastNameCompare;
        }

        return a.firstName.localeCompare(b.firstName);
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
      avatarPublicId: (member.profileId as any).avatar?.publicId || null,
      isClaimed: (member.profileId as any).isClaimed,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }

    return sendSuccess(res, StatusCodes.OK, modifiedMember, 'Fetched team member successfully');
  } catch (error) {
    logger.error({ teamId, profileId, error }, 'Error fetching team member');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'An error occurred while fetching the team member'
    );
  }
};

export const editTeamMember = async (req: AuthRequest, res: Response) => {
  const { profileId } = req.params;

  if (!profileId || Array.isArray(profileId) || !mongoose.Types.ObjectId.isValid(profileId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid profile ID');
  }

  const {
    firstName,
    lastName,
    positions,
    jerseyNumber,
    avatarPublicId,
  } = req.body;

  let avatar;

  try {
    if (req.file) {
      avatar = await uploadUserProfileImage(req.file.path, avatarPublicId);
    }

    const profilePayload: Partial<{
      firstName: string;
      lastName: string;
      avatar: {
        url: string;
        publicId: string;
      };
    }> = {
      firstName,
      lastName,
    };

    if (avatar) {
      profilePayload.avatar = {
        url: avatar.url,
        publicId: avatar.publicId,
      };
    }

    const positionsArray = positions.split(',').map((pos: string) => pos.trim());

    const teamMemberPayload = {
      positions: positionsArray,
      jerseyNumber,
    }

    const objectProfileId = new Types.ObjectId(profileId);

    await updateProfile(objectProfileId, profilePayload);

    const editedTeamMember = await updateTeamMember(objectProfileId, teamMemberPayload);

    return sendSuccess(res, StatusCodes.OK, editedTeamMember, 'Team member updated successfully');
  } catch (error) {
    logger.error({ error }, 'Error editing team member');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'An error occurred while editing the team member'
    );
  }
};
