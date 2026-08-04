import { StatusCodes } from 'http-status-codes';
import { Response } from 'express';

import { sendError, sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../team/team.types';
import { getNotificationsForProfile } from './notification.service';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const profileId = req.user?.profileId;

    const notifications = await getNotificationsForProfile(profileId as string);

    sendSuccess(res, StatusCodes.OK, notifications, 'Notifications retrieved successfully');
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to retrieve notifications.';

    sendError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      message,
    );
  }
};
