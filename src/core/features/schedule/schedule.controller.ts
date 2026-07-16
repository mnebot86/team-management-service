import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import * as scheduleService from './schedule.service';
import { sendError, sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../team/team.types';
import { logger } from '../../shared/utils/logger';
import { emitScheduleCreated } from './schedule.emitters';

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

    emitScheduleCreated(teamId, schedule);

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

export const getNextPractice = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const { teamId } = req.params;

  if (!teamId || !Types.ObjectId.isValid(teamId as string)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid team ID');
  }

  try {
    const practice = await scheduleService.getNextPractice(
      new Types.ObjectId(teamId as string),
    );

    return sendSuccess(
      res,
      StatusCodes.OK,
      practice,
      'Next practice retrieved successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Error retrieving next practice');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to retrieve next practice',
    );
  }
};

export const getLastPractice = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const { teamId } = req.params;

  if (!teamId || !Types.ObjectId.isValid(teamId as string)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid team ID');
  }

  try {
    const attendanceSummary = await scheduleService.getLastPractice(
      new Types.ObjectId(teamId as string),
    );

    return sendSuccess(
      res,
      StatusCodes.OK,
      attendanceSummary,
      'Last practice attendance retrieved successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Error retrieving last practice attendance');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to retrieve last practice attendance',
    );
  }
};

export const getNextGame = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const { teamId } = req.params;

  if (!teamId || !Types.ObjectId.isValid(teamId as string)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid team ID');
  }

  try {
    const game = await scheduleService.getNextGame(
      new Types.ObjectId(teamId as string),
    );

    return sendSuccess(
      res,
      StatusCodes.OK,
      game,
      'Next game retrieved successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Error retrieving next game');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to retrieve next game',
    );
  }
};

export const updateAttendance = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const { scheduleId } = req.params;
  const { attendance } = req.body;
  const markedByUserId = req.user?.id;

  if (!scheduleId || !Types.ObjectId.isValid(scheduleId as string)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid schedule ID');
  }

  if (!markedByUserId || !Types.ObjectId.isValid(markedByUserId)) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid user');
  }

  try {
    const attendanceWithUser = attendance.map((record: any) => ({
      ...record,
      markedByUserId: new Types.ObjectId(markedByUserId),
    }));

    const schedule = await scheduleService.updateAttendance(
      new Types.ObjectId(scheduleId as string),
      attendanceWithUser,
    );

    return sendSuccess(
      res,
      StatusCodes.OK,
      schedule,
      'Attendance updated successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Error updating attendance');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update attendance',
    );
  }
};

export const getPlayerAttendance = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const { profileId } = req.params;

  if (!profileId || !Types.ObjectId.isValid(profileId as string)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Invalid profile ID',
    );
  }

  try {
    const attendance = await scheduleService.getPlayerAttendance(
      new Types.ObjectId(profileId as string),
    );

    return sendSuccess(
      res,
      StatusCodes.OK,
      attendance,
      'Player attendance retrieved successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Error retrieving player attendance');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to retrieve player attendance',
    );
  }
};
