import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Error as MongooseError, Types } from 'mongoose';

import { sendError, sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../team/team.types';
import { TeamMember } from '../teamMember/teamMember.modal';
import { NOTIFICATION_TYPES } from '../notifications/notification.model';
import { createNotification } from '../notifications/notification.service';
import {
  createDeptChart,
  deleteDeptChart,
  DeptChartPositionNotFoundError,
  getDeptChartFilters,
  getDeptCharts,
  updateDeptChart,
} from './deptChart.services';

type MongoServerError = Error & { code?: number };

type DeptChartNotificationAction = 'created' | 'updated' | 'deleted';

const notifyDeptChartChanged = async (
  teamId: string,
  deptChartId: string,
  deptChartName: string,
  action: DeptChartNotificationAction,
): Promise<void> => {
  const members = await TeamMember.find({
    teamId,
    role: { $in: ['coach', 'player'] },
  }).select('profileId');

  if (members.length === 0) {
    return;
  }

  const notificationTypes = {
    created: NOTIFICATION_TYPES.DEPT_CHART_CREATED,
    updated: NOTIFICATION_TYPES.DEPT_CHART_UPDATED,
    deleted: NOTIFICATION_TYPES.DEPT_CHART_DELETED,
  };

  await createNotification({
    recipients: members.map(({ profileId }) => ({
      profileId: profileId.toString(),
    })),
    teamId,
    type: notificationTypes[action],
    title: `Dept chart ${action}`,
    message: `${deptChartName} was ${action}.`,
    entity: {
      type: 'dept-chart',
      id: deptChartId,
    },
  });
};

export const createDeptChartController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { teamId } = req.params;
  const { profileId } = req.user ?? {};
  const { name, positions } = req.body;

  if (!teamId || !Types.ObjectId.isValid(teamId as string)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'A valid team id is required.');
    return;
  }

  if (!profileId || !Types.ObjectId.isValid(profileId)) {
    sendError(res, StatusCodes.UNAUTHORIZED, 'An authenticated profile is required.');
    return;
  }

  if (typeof name !== 'string' || !name.trim()) {
    sendError(res, StatusCodes.BAD_REQUEST, 'Dept chart name is required.');
    return;
  }

  if (positions !== undefined && !Array.isArray(positions)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'Positions must be an array.');
    return;
  }

  try {
    const deptChart = await createDeptChart({
      teamId: teamId as string,
      name: name.trim(),
      ...(positions !== undefined ? { positions } : {}),
      createdBy: profileId,
    });

    await notifyDeptChartChanged(
      deptChart.teamId.toString(),
      deptChart._id.toString(),
      deptChart.name,
      'created',
    );

    sendSuccess(
      res,
      StatusCodes.CREATED,
      deptChart,
      'Dept chart created successfully.',
    );
  } catch (error) {
    if ((error as MongoServerError).code === 11000) {
      sendError(
        res,
        StatusCodes.CONFLICT,
        'A dept chart with this name already exists for the team.',
      );
      return;
    }

    if (error instanceof MongooseError.ValidationError) {
      sendError(res, StatusCodes.BAD_REQUEST, error.message);
      return;
    }

    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Unable to create dept chart.',
    );
  }
};

export const getDeptChartFiltersController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { teamId } = req.params;

  if (!teamId || !Types.ObjectId.isValid(teamId as string)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'A valid team id is required.');
    return;
  }

  try {
    const filters = await getDeptChartFilters(teamId as string);

    sendSuccess(
      res,
      StatusCodes.OK,
      filters,
      'Dept chart filters retrieved successfully.',
    );
  } catch {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Unable to retrieve dept chart filters.',
    );
  }
};

export const getDeptChartsController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { teamId } = req.params;
  const { name } = req.query;

  if (!teamId || !Types.ObjectId.isValid(teamId as string)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'A valid team id is required.');
    return;
  }

  if (name !== undefined && typeof name !== 'string') {
    sendError(res, StatusCodes.BAD_REQUEST, 'Name must be a string.');
    return;
  }

  const normalizedName = typeof name === 'string' ? name.trim() : undefined;

  if (name !== undefined && !normalizedName) {
    sendError(res, StatusCodes.BAD_REQUEST, 'Name cannot be empty.');
    return;
  }

  try {
    const deptCharts = await getDeptCharts(
      teamId as string,
      normalizedName,
    );

    sendSuccess(
      res,
      StatusCodes.OK,
      deptCharts,
      'Dept charts retrieved successfully.',
    );
  } catch {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Unable to retrieve dept charts.',
    );
  }
};

export const updateDeptChartController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { deptChartId } = req.params;
  const { name, positions, addPlayers, removePlayers } = req.body;

  if (!deptChartId || !Types.ObjectId.isValid(deptChartId as string)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'A valid dept chart id is required.');
    return;
  }

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    sendError(res, StatusCodes.BAD_REQUEST, 'Dept chart name cannot be empty.');
    return;
  }

  const arrayFields = { positions, addPlayers, removePlayers };

  for (const [field, value] of Object.entries(arrayFields)) {
    if (value !== undefined && !Array.isArray(value)) {
      sendError(res, StatusCodes.BAD_REQUEST, `${field} must be an array.`);
      return;
    }
  }

  if (
    name === undefined
    && positions === undefined
    && addPlayers === undefined
    && removePlayers === undefined
  ) {
    sendError(res, StatusCodes.BAD_REQUEST, 'No updates were provided.');
    return;
  }

  try {
    const deptChart = await updateDeptChart(deptChartId as string, {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(positions !== undefined ? { positions } : {}),
      ...(addPlayers !== undefined ? { addPlayers } : {}),
      ...(removePlayers !== undefined ? { removePlayers } : {}),
    });

    if (!deptChart) {
      sendError(res, StatusCodes.NOT_FOUND, 'Dept chart not found.');
      return;
    }

    await notifyDeptChartChanged(
      deptChart.teamId.toString(),
      deptChart._id.toString(),
      deptChart.name,
      'updated',
    );

    sendSuccess(
      res,
      StatusCodes.OK,
      deptChart,
      'Dept chart updated successfully.',
    );
  } catch (error) {
    if ((error as MongoServerError).code === 11000) {
      sendError(
        res,
        StatusCodes.CONFLICT,
        'A dept chart with this name already exists for the team.',
      );
      return;
    }

    if (
      error instanceof MongooseError.ValidationError
      || error instanceof DeptChartPositionNotFoundError
      || error instanceof MongooseError.CastError
    ) {
      sendError(res, StatusCodes.BAD_REQUEST, error.message);
      return;
    }

    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Unable to update dept chart.',
    );
  }
};

export const deleteDeptChartController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { deptChartId } = req.params;

  if (!deptChartId || !Types.ObjectId.isValid(deptChartId as string)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'A valid dept chart id is required.');
    return;
  }

  try {
    const deptChart = await deleteDeptChart(deptChartId as string);

    if (!deptChart) {
      sendError(res, StatusCodes.NOT_FOUND, 'Dept chart not found.');
      return;
    }

    await notifyDeptChartChanged(
      deptChart.teamId.toString(),
      deptChart._id.toString(),
      deptChart.name,
      'deleted',
    );

    sendSuccess(
      res,
      StatusCodes.OK,
      deptChart,
      'Dept chart deleted successfully.',
    );
  } catch {
    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Unable to delete dept chart.',
    );
  }
};
