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
import { TEAM_ROLES, TeamRole } from './teamMember.modal';
import { Team } from '../team/team.model';
import {
  getPositionDefinition,
  resolvePositionIds,
  UnsupportedSportError,
} from '../sports/sport.registry';

const parsePositionValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  if (value.trim().startsWith('[')) {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
      throw new Error('Positions must be an array of strings.');
    }

    return parsed;
  }

  return value.split(',').map((item) => item.trim()).filter(Boolean);
};

const getPositionLabels = (
  sportId: string,
  sportVariantId: string,
  positionIds: string[],
) => positionIds.map(
  (positionId) => getPositionDefinition(sportId, sportVariantId, positionId)?.name,
).filter((name): name is string => Boolean(name));

export const getRoster = async (req: Request, res: Response) => {
  const teamId = req.params.teamId as string;
  const role = req.query.role;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid team ID' });
  }

  const validRoles = Object.values(TEAM_ROLES);

  if (role !== undefined && (typeof role !== 'string' || !validRoles.includes(role as TeamRole))) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      `Invalid role. Expected one of: ${validRoles.join(', ')}`,
    );
  }

  try {
    const team = await Team.findById(teamId).select('sportId sportVariantId');

    if (!team) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Team not found');
    }

    const members = await getTeamMembers(
      new mongoose.Types.ObjectId(teamId),
      role as TeamRole | undefined,
    );

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

        const positionIds = member.positionIds ?? [];
        const positionLabels = positionIds.length > 0
          ? getPositionLabels(
            team.sportId ?? 'football',
            team.sportVariantId ?? 'tackle-11',
            positionIds,
          )
          : member.positions ?? [];

        return {
          profileId: profile._id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: member.role,
          isClaimed: profile.isClaimed,
          linkCode: profile.linkCode,
          imageUrl: profile.avatar?.url || null,
          jerseyNumber: member.jerseyNumber,
          positionIds,
          positions: positionLabels,
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
  } catch (error) {
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

    const team = await Team.findById(teamId).select('sportId sportVariantId');
    const positionIds = member.positionIds ?? [];
    const modifiedMember = {
      firstName: (member.profileId as any).firstName,
      lastName: (member.profileId as any).lastName,
      role: member.role,
      jerseyNumber: member.jerseyNumber,
      positionIds,
      positions: team && positionIds.length > 0
        ? getPositionLabels(
          team.sportId ?? 'football',
          team.sportVariantId ?? 'tackle-11',
          positionIds,
        )
        : member.positions,
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
  const { teamId, profileId } = req.params;

  if (
    !teamId
    || Array.isArray(teamId)
    || !mongoose.Types.ObjectId.isValid(teamId)
    || !profileId
    || Array.isArray(profileId)
    || !mongoose.Types.ObjectId.isValid(profileId)
  ) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid team or profile ID');
  }

  const {
    firstName,
    lastName,
    positions,
    positionIds,
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

    const team = await Team.findById(teamId).select('sportId sportVariantId');

    if (!team) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Team not found');
    }

    const resolvedPositionIds = resolvePositionIds(
      team.sportId ?? 'football',
      team.sportVariantId ?? 'tackle-11',
      parsePositionValues(positionIds ?? positions),
    );
    const teamMemberPayload = {
      positionIds: resolvedPositionIds,
      positions: getPositionLabels(
        team.sportId ?? 'football',
        team.sportVariantId ?? 'tackle-11',
        resolvedPositionIds,
      ),
      jerseyNumber,
    };

    const objectTeamId = new Types.ObjectId(teamId);
    const objectProfileId = new Types.ObjectId(profileId);

    await updateProfile(objectProfileId, profilePayload);

    const editedTeamMember = await updateTeamMember(
      objectTeamId,
      objectProfileId,
      teamMemberPayload,
    );

    return sendSuccess(res, StatusCodes.OK, editedTeamMember, 'Team member updated successfully');
  } catch (error) {
    logger.error({ error }, 'Error editing team member');

    return sendError(
      res,
      error instanceof UnsupportedSportError
        ? StatusCodes.BAD_REQUEST
        : StatusCodes.INTERNAL_SERVER_ERROR,
      error instanceof Error
        ? error.message
        : 'An error occurred while editing the team member',
    );
  }
};
