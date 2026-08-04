import { Response } from 'express';
import {
  createPracticePlan,
  deletePracticePlan,
  getPracticePlansByTeamId,
  updatePracticePlan,
} from './practice.service';
import { AuthRequest } from '../team/team.types';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { StatusCodes } from 'http-status-codes';

export const createPracticePlanController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.id;

    if (!teamId) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Team id is required.');
      return;
    }

    if (!userId) {
      sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      return;
    }

    const practicePlan = await createPracticePlan({
      teamId,
      createdBy: userId.toString(),
      ...req.body,
    });

    sendSuccess(res, StatusCodes.CREATED, practicePlan, 'Practice plan created successfully.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create practice plan.';

    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, message);
  }
};

export const getPracticePlansByTeamIdController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Team id is required.');
      return;
    }

    const practicePlans = await getPracticePlansByTeamId(teamId as string);

    sendSuccess(
      res,
      StatusCodes.OK,
      practicePlans,
      'Practice plans retrieved successfully.'
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to retrieve practice plans.';

    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, message);
  }
};

export const updatePracticePlanController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { planId } = req.params;
    const userId = req.user?.id;

    if (!planId) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Practice plan id is required.');
      return;
    }

    if (!userId) {
      sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      return;
    }

    const practicePlan = await updatePracticePlan(
      planId as string,
      {
        ...req.body,
        updatedBy: userId.toString(),
      }
    );

    if (!practicePlan) {
      sendError(res, StatusCodes.NOT_FOUND, 'Practice plan not found.');
      return;
    }

    sendSuccess(
      res,
      StatusCodes.OK,
      practicePlan,
      'Practice plan updated successfully.'
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to update practice plan.';

    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, message);
  }
};

export const deletePracticePlanController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { planId } = req.params;
    const userId = req.user?.id;

    if (!planId) {
      sendError(res, StatusCodes.BAD_REQUEST, 'Practice plan id is required.');
      return;
    }

    if (!userId) {
      sendError(res, StatusCodes.UNAUTHORIZED, 'Unauthorized');
      return;
    }

    const deleted = await deletePracticePlan(planId as string);

    if (!deleted) {
      sendError(res, StatusCodes.NOT_FOUND, 'Practice plan not found.');
      return;
    }

    sendSuccess(
      res,
      StatusCodes.OK,
      null,
      'Practice plan deleted successfully.'
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to delete practice plan.';

    sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, message);
  }
};
