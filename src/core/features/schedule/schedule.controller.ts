import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import * as scheduleService from './schedule.service';
import { sendError, sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../team/team.types';
import { logger } from '../../shared/utils/logger';

export const createSchedule = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const {
    teamId,
    title,
    description,
    eventType,
    opponentName,
    isHomeGame,
    startDate,
    startTime,
    endTime,
    locationName,
    streetAddress,
    city,
    state,
    zipCode,
    recurrence,
  } = req.body;

  const createdByUserId = req.user?.id;

  if (!teamId || !Types.ObjectId.isValid(teamId)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid team ID');
  }

  if (!createdByUserId || !Types.ObjectId.isValid(createdByUserId)) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid user');
  }

  try {
    const schedule = await scheduleService.createSchedule({
      teamId: new Types.ObjectId(teamId),
      title,
      description,
      type: eventType,
      opponentName,
      isHomeGame,
      startDate,
      startTime,
      endTime,
      location: {
        name: locationName,
        street: streetAddress,
        city,
        state,
        zip: zipCode,
      },
      recurrence,
      createdByUserId: new Types.ObjectId(createdByUserId),
    });

    return sendSuccess(
      res,
      StatusCodes.CREATED,
      schedule,
      'Schedule event created successfully',
    );
  } catch (error) {
    logger.error({ error: error }, 'Error creating schedule event');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create schedule event',
    );
  }

};

export const getTeamSchedule = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const { teamId } = req.params;

  if (!teamId || !Types.ObjectId.isValid(teamId as string)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid team ID');
  }

  try {
    const schedule = await scheduleService.getTeamSchedule(
      new Types.ObjectId(teamId as string),
    );

    return sendSuccess(
      res,
      StatusCodes.OK,
      schedule,
      'Team schedule retrieved successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Error retrieving team schedule');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to retrieve team schedule',
    );
  }
};
