import { Request, Response } from 'express';
import * as teamService from './team.service';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { CreateTeamDto } from './team.dto';
import { MONGO_ERRORS } from '../../constants/mongoErrors';

export const createTeam = async (req: Request, res: Response) => {
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

  const sanitizedPayload: CreateTeamDto = {
    name: name.trim(),
    ageGroup: ageGroup.trim(),
    sport: sport.trim()
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
