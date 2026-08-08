import mongoose, { Types } from 'mongoose';
import { Response } from 'express';

import * as teamService from './team.service';
import * as teamMemberService from '../teamMember/teamMember.service'
import * as userProfileService from '../userProfile/userProfile.service'
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { CreateTeamDto } from './team.dto';
import { MONGO_ERRORS } from '../../constants/mongoErrors';
import { AuthRequest } from './team.types';
import { emitTeamCreated } from './team.emitter';
import {
  getSport,
  getSportVariant,
  UnsupportedSportError,
} from '../sports/sport.registry';

export const createTeam = async (req: AuthRequest, res: Response) => {
  const payload: CreateTeamDto = req.body;

  const { name, ageGroup, sport, sportId, sportVariantId } = payload;

  if (!name) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Name is required',
    );
  }

  if (!ageGroup) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Age Group is required',
    );
  }

  const normalizedSportId = (sportId || sport || '').trim().toLowerCase();
  const sportDefinition = getSport(normalizedSportId);

  if (!sportDefinition) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'A supported sport is required',
    );
  }

  const normalizedVariantId = sportVariantId?.trim()
    || sportDefinition.defaultVariantId;

  if (!getSportVariant(sportDefinition.id, normalizedVariantId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Unsupported sport variant');
  }

  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const sanitizedPayload: CreateTeamDto = {
    name: name.trim(),
    ageGroup: ageGroup.trim(),
    sport: sportDefinition.name,
    sportId: sportDefinition.id,
    sportVariantId: normalizedVariantId,
    ownerId: new mongoose.Types.ObjectId(req.user.id),
  };

  try {
    const team = await teamService.createTeam(sanitizedPayload);

    emitTeamCreated(req.user.id, team);

    return sendSuccess(res, StatusCodes.CREATED, team, 'Team created successfully');
  } catch (error) {
    const err = error as { code?: number };

    if (err?.code === MONGO_ERRORS.DUPLICATE_KEY) {
      return sendError(
        res,
        StatusCodes.CONFLICT,
        'A team with the same name, age group, and sport already exists'
      );
    }

    if (error instanceof UnsupportedSportError) {
      return sendError(res, StatusCodes.BAD_REQUEST, error.message);
    }

    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create team', error);
  }
};

export const getTeams = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  try {
    const [userProfile] = await userProfileService.getUserProfiles(
      new Types.ObjectId(req.user.id)
    );

    if (!userProfile) {
      return sendError(res, StatusCodes.NOT_FOUND, 'User profile not found');
    }

    const teams = await teamMemberService.getTeamsForUser(
      new Types.ObjectId(userProfile.profileId)
    );

    const modifiedTeams = teams.map((teamMember) => {
      const teamMemberObject = teamMember.toObject();

      const { teamId, ...rest } = teamMemberObject;

      return {
        ...rest,
        team: teamId,
      };
    });

    return sendSuccess(res, StatusCodes.OK, modifiedTeams, 'Teams fetched successfully');
  } catch (error) {
    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch teams',
      error,
    );
  }
};

export const getTeam = async (req: AuthRequest, res: Response) => {
  const teamId = req.params.teamId as string;

  if (!teamId) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Team Id is required in params',
    );
  }

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Invalid Team Id',
    );
  }

  try {
    const team = await teamService.getTeamById(teamId);

    if (!team) {
      return sendError(
        res,
        StatusCodes.NOT_FOUND,
        'Team not found',
      );
    }

    return sendSuccess(
      res,
      StatusCodes.OK,
      team,
      'Team fetched successfully',
    );
  } catch (error) {
    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch team',
      error,
    );
  }
};

export const updateTeam = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const teamId = req.params.teamId as string;

  const {
    name,
    ageGroup,
    sport,
    sportId,
    sportVariantId,
  } = req.body as Partial<CreateTeamDto>;

  if (sport || sportId || sportVariantId) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Team sport configuration cannot be changed after creation',
    );
  }

  if (!name && !ageGroup) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'At least one field is required to update');
  }

  const updatePayload: Partial<CreateTeamDto> = {
    ...(name ? { name: name.trim() } : {}),
    ...(ageGroup ? { ageGroup: ageGroup.trim() } : {}),
  };

  // TODO: Add permission check using TeamMember (coach)

  try {
    const updated = await teamService.updateTeam(teamId, updatePayload);

    return sendSuccess(res, StatusCodes.OK, updated, 'Team updated successfully');
  } catch (error) {
    const err = error as { code?: number };

    if (err?.code === MONGO_ERRORS.DUPLICATE_KEY) {
      return sendError(
        res,
        StatusCodes.CONFLICT,
        'A team with the same name, age group, and sport already exists'
      );
    }

    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update team', error);
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const teamId = req.params.teamId as string;

  // TODO: Add permission check using TeamMember (coach only)

  try {
    await teamService.deleteTeam(teamId);

    return sendSuccess(res, StatusCodes.OK, null, 'Team deleted successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete team', error);
  }
};

export const getActiveTeamsCount = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  try {
    const teams = await teamMemberService.getTeamsForUser(new mongoose.Types.ObjectId(req.user.profileId));

    const activeTeamsCount = teams.filter((team) => team.isActive).length;

    return sendSuccess(res, StatusCodes.OK, { count: activeTeamsCount }, 'Active teams count fetched successfully');
  } catch (error) {
    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch active teams count',
      error,
    );
  }
};
