import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import * as scheduleService from './schedule.service';
import { ScheduleDocument } from './schedule.model';
import { sendError, sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../team/team.types';
import { logger } from '../../shared/utils/logger';
import {
  emitScheduleCreated,
  emitScheduleDeleted,
  emitScheduleUpdated,
} from './schedule.emitters';
import { TeamMember } from '../teamMember/teamMember.modal';
import { createNotification } from '../notifications/notification.service';
import { NOTIFICATION_TYPES } from '../notifications/notification.model';

const notifyScheduleCreated = async (
  teamId: string,
  schedule: Awaited<ReturnType<typeof scheduleService.createSchedule>>,
): Promise<void> => {
  const type = schedule.type === 'practice'
    ? NOTIFICATION_TYPES.PRACTICE_CREATED
    : schedule.type === 'game'
      ? NOTIFICATION_TYPES.GAME_CREATED
      : null;

  if (!type) {
    return;
  }

  const recipients = await TeamMember.find({ teamId }).select('profileId');

  await createNotification({
    recipients: recipients.map(({ profileId }) => ({
      profileId: profileId.toString(),
    })),
    teamId,
    type,
    title: schedule.title || (schedule.type === 'game' ? 'New Game' : 'New Practice'),
    message: `A new ${schedule.type} was added to the team schedule.`,
    entity: {
      type: 'schedule',
      id: schedule._id.toString(),
    },
  });
};

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
    await notifyScheduleCreated(teamId, schedule);

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

export const updateSchedule = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const { scheduleId } = req.params;
  const updatedByUserId = req.user?.id;

  if (!scheduleId || !Types.ObjectId.isValid(scheduleId as string)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid schedule ID');
  }

  const {
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
  const scope = req.body.scope ?? 'occurrence';

  if (!['occurrence', 'series'].includes(scope)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid update scope');
  }

  if (!updatedByUserId || !Types.ObjectId.isValid(updatedByUserId)) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid user');
  }

  try {
    const schedule = await scheduleService.updateSchedule(
      new Types.ObjectId(scheduleId as string),
      {
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
      },
      scope === 'series',
    );

    if (!schedule) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Schedule not found');
    }

    emitScheduleUpdated(schedule.teamId.toString(), schedule);

    return sendSuccess(
      res,
      StatusCodes.OK,
      schedule,
      'Schedule event updated successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Error updating schedule event');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update schedule event',
    );
  }
};

export const cancelSchedule = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const { scheduleId } = req.params;
  const cancelledByUserId = req.user?.id;
  const { reason } = req.body;
  const scope = req.body.scope ?? 'occurrence';

  if (!scheduleId || !Types.ObjectId.isValid(scheduleId as string)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid schedule ID');
  }

  if (!cancelledByUserId || !Types.ObjectId.isValid(cancelledByUserId)) {
    return sendError(res, StatusCodes.UNAUTHORIZED, 'Invalid user');
  }

  if (!['occurrence', 'series'].includes(scope)) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Invalid cancellation scope. Expected occurrence or series',
    );
  }

  try {
    const schedule = await scheduleService.cancelSchedule(
      new Types.ObjectId(scheduleId as string),
      new Types.ObjectId(cancelledByUserId),
      reason,
      scope === 'series',
    );

    if (!schedule) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Schedule not found');
    }

    emitScheduleUpdated(schedule.teamId.toString(), schedule);

    return sendSuccess(
      res,
      StatusCodes.OK,
      schedule,
      'Schedule event cancelled successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Error cancelling schedule event');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to cancel schedule event',
    );
  }
};

export const deleteSchedule = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const { scheduleId } = req.params;
  const scope = req.query.scope ?? 'occurrence';

  if (!scheduleId || !Types.ObjectId.isValid(scheduleId as string)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid schedule ID');
  }

  if (scope !== 'occurrence' && scope !== 'series') {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Invalid deletion scope. Expected occurrence or series',
    );
  }

  try {
    const schedule = await scheduleService.deleteSchedule(
      new Types.ObjectId(scheduleId as string),
      scope === 'series',
    );

    if (!schedule) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Schedule not found');
    }

    emitScheduleDeleted(
      schedule.teamId.toString(),
      scheduleId as string,
      scope,
      schedule.recurrenceGroupId?.toString(),
    );

    return sendSuccess(
      res,
      StatusCodes.OK,
      null,
      scope === 'series'
        ? 'Recurring schedule series deleted successfully'
        : 'Schedule occurrence deleted successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Error deleting schedule event');

    return sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to delete schedule event',
    );
  }
};

export const getTeamSchedule = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  const { teamId } = req.params;
  const { period } = req.query;

  if (!teamId || !Types.ObjectId.isValid(teamId as string)) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid team ID');
  }

  if (
    period !== undefined
    && (typeof period !== 'string' || !['upcoming', 'past'].includes(period))
  ) {
    return sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Invalid period. Expected one of: upcoming, past',
    );
  }

  try {
    const schedule = await scheduleService.getTeamSchedule(
      new Types.ObjectId(teamId as string),
      period as scheduleService.SchedulePeriod | undefined,
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

  if (!Array.isArray(attendance) || attendance.some(record =>
    !record
    || !Types.ObjectId.isValid(record.profileId)
    || !['present', 'late', 'absent'].includes(record.status))) {
    return sendError(res, StatusCodes.BAD_REQUEST, 'Invalid attendance');
  }

  try {
    const attendanceWithUser: ScheduleDocument['attendance'] = attendance.map((record: {
      profileId: string;
      status: 'present' | 'late' | 'absent';
      note?: string;
    }) => ({
      profileId: new Types.ObjectId(record.profileId),
      status: record.status,
      ...(record.note !== undefined ? { note: record.note } : {}),
      markedByUserId: new Types.ObjectId(markedByUserId),
      markedAt: new Date(),
    }));

    const schedule = await scheduleService.updateAttendance(
      new Types.ObjectId(scheduleId as string),
      attendanceWithUser,
    );

    if (!schedule) {
      return sendError(res, StatusCodes.NOT_FOUND, 'Schedule not found');
    }

    const teamId = schedule.teamId.toString();
    emitScheduleUpdated(teamId, schedule);

    const recipientIds = [...new Set<string>(
      attendanceWithUser.map((record: { profileId: Types.ObjectId | string }) =>
        record.profileId.toString(),
      ),
    )];

    if (recipientIds.length > 0) {
      await createNotification({
        recipients: recipientIds.map(profileId => ({ profileId })),
        teamId,
        type: NOTIFICATION_TYPES.ATTENDANCE_TAKEN,
        title: 'Attendance Updated',
        message: 'Attendance has been recorded for a team event.',
        entity: {
          type: 'schedule',
          id: schedule._id.toString(),
        },
      });
    }

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
