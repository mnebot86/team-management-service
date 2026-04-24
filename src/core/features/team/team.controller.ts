import mongoose from 'mongoose';
import { Response } from 'express';

import * as teamService from './team.service';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { CreateTeamDto } from './team.dto';
import { MONGO_ERRORS } from '../../constants/mongoErrors';
import { AuthRequest } from './team.types';
import { getUserRoleInTeam, canUpdateTeam, canDeleteTeam, canManageMembers } from './team.permissions';

export const createTeam = async (req: AuthRequest, res: Response) => {
  const payload: CreateTeamDto = req.body;

  const { name, ageGroup, sport } = payload;

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

  if (!sport) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Sport is required',
    );
  }

  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const sanitizedPayload: CreateTeamDto = {
    name: name.trim(),
    ageGroup: ageGroup.trim(),
    sport: sport.trim(),
    ownerId: new mongoose.Types.ObjectId(req.user.id),
  };

  try {
    const team = await teamService.createTeam(sanitizedPayload);

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

    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create team', error);
  }
};

export const getTeams = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  try {
    const teams = await teamService.getTeamsForUser(req.user.id);

    return sendSuccess(res, StatusCodes.OK, teams, 'Teams fetched successfully');
  } catch (error) {
    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch team',
      error,
    );
  }
}

export const getTeam = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

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
    const team = await teamService.getTeamByIdForUser(
      teamId,
      req.user.id,
    );

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

  if (!teamId) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Team Id is required in params');
  }

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Team Id');
  }

  const { name, ageGroup, sport } = req.body as Partial<CreateTeamDto>;

  if (!name && !ageGroup && !sport) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'At least one field is required to update');
  }

  const updatePayload: Partial<CreateTeamDto> = {
    ...(name ? { name: name.trim() } : {}),
    ...(ageGroup ? { ageGroup: ageGroup.trim() } : {}),
    ...(sport ? { sport: sport.trim() } : {}),
  };

  try {
    const team = await teamService.getTeamByIdForUser(teamId, req.user.id);

    if (!team) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Team not found');
    }

    const role = getUserRoleInTeam(team, req.user.id);

    if (!canUpdateTeam(role)) {
      return sendError(res, StatusCodes.FORBIDDEN, 'Forbidden');
    }

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

  if (!teamId) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Team Id is required in params');
  }

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Team Id');
  }

  try {
    const team = await teamService.getTeamByIdForUser(teamId, req.user.id);

    if (!team) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Team not found');
    }

    const role = getUserRoleInTeam(team, req.user.id);

    if (!canDeleteTeam(role)) {
      return sendError(res, StatusCodes.FORBIDDEN, 'Forbidden');
    }

    await teamService.deleteTeam(teamId);

    return sendSuccess(res, StatusCodes.OK, null, 'Team deleted successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete team', error);
  }
};

export const addTeamMember = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const teamId = req.params.teamId as string;
  const { userId, role } = req.body as { userId?: string; role?: string };

  if (!teamId) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Team Id is required in params');
  }

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Team Id');
  }

  if (!userId) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'User Id is required');
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid User Id');
  }

  try {
    const team = await teamService.getTeamByIdForUser(teamId, req.user.id);

    if (!team) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Team not found');
    }

    const roleCheck = getUserRoleInTeam(team, req.user.id);

    if (!canManageMembers(roleCheck)) {
      return sendError(res, StatusCodes.FORBIDDEN, 'Forbidden');
    }

    const updated = await teamService.addMemberToTeam(teamId, userId, role || 'player');

    return sendSuccess(res, StatusCodes.OK, updated, 'Member added successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to add member', error);
  }
};

export const removeTeamMember = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const teamId = req.params.teamId as string;
  const memberId = req.params.userId as string;

  if (!teamId) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Team Id is required in params');
  }

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid Team Id');
  }

  if (!memberId) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'User Id is required in params');
  }

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid User Id');
  }

  try {
    const team = await teamService.getTeamByIdForUser(teamId, req.user.id);

    if (!team) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Team not found');
    }

    const roleCheck = getUserRoleInTeam(team, req.user.id);

    if (!canManageMembers(roleCheck)) {
      return sendError(res, StatusCodes.FORBIDDEN, 'Forbidden');
    }

    const updated = await teamService.removeMemberFromTeam(teamId, memberId);

    return sendSuccess(res, StatusCodes.OK, updated, 'Member removed successfully');
  } catch (error) {
    return sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to remove member', error);
  }
};
