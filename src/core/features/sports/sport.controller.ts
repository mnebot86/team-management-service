import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { sendError, sendSuccess } from '../../shared/utils/response';
import { getSport, getSports } from './sport.registry';

export const listSports = (_req: Request, res: Response) => sendSuccess(
  res,
  StatusCodes.OK,
  getSports(),
  'Sports retrieved successfully.',
);

export const getSportDefinition = (req: Request, res: Response) => {
  const sportId = req.params.sportId as string;
  const sport = getSport(sportId);

  if (!sport) {
    return sendError(res, StatusCodes.NOT_FOUND, 'Sport not found.');
  }

  return sendSuccess(
    res,
    StatusCodes.OK,
    sport,
    'Sport retrieved successfully.',
  );
};
