import mongoose from 'mongoose';
import { Response } from 'express';

import * as teamService from './team.service';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { CreateTeamDto } from './team.dto';
import { MONGO_ERRORS } from '../../constants/mongoErrors';
import { AuthRequest } from './team.types';

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
    const teams = await teamService.getTeams(req.user.id);

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
    const team = await teamService.getTeamByIdAndOwner(
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
