import { StatusCodes } from 'http-status-codes';
import { Response } from 'express';
import { Types } from 'mongoose';

import { sendError, sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../team/team.types';
import {
  getNotificationsForProfile,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './notification.service';
import { UserProfile } from '../userProfile/userProfile.model';
import { getSocket } from '../../socket';

const resolveProfileId = async (req: AuthRequest): Promise<string | null> => {
  if (!req.user?.id) {
    return null;
  }

  if (req.user.profileId && Types.ObjectId.isValid(req.user.profileId)) {
    const linkedProfile = await UserProfile.exists({
      userId: req.user.id,
      profileId: req.user.profileId,
    });

    if (linkedProfile) {
      return req.user.profileId;
    }
  }

  const userProfile = await UserProfile.findOne({ userId: req.user.id })
    .select('profileId');

  return userProfile?.profileId.toString() ?? null;
};

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const profileId = await resolveProfileId(req);

    if (!profileId) {
      sendError(res, StatusCodes.NOT_FOUND, 'User profile not found');
      return;
    }

    const notifications = await getNotificationsForProfile(profileId);

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

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const profileId = await resolveProfileId(req);

  if (!profileId) {
    sendError(res, StatusCodes.NOT_FOUND, 'User profile not found');
    return;
  }

  const count = await getUnreadNotificationCount(profileId);
  sendSuccess(res, StatusCodes.OK, { count }, 'Unread count retrieved successfully');
};

export const markRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const notificationId = req.params.notificationId as string;
  const profileId = await resolveProfileId(req);

  if (!profileId || !Types.ObjectId.isValid(notificationId)) {
    sendError(res, StatusCodes.BAD_REQUEST, 'Invalid notification or profile');
    return;
  }

  const notification = await markNotificationRead(notificationId, profileId);

  if (!notification) {
    sendError(res, StatusCodes.NOT_FOUND, 'Notification not found');
    return;
  }

  const unreadCount = await getUnreadNotificationCount(profileId);
  getSocket().to(`profile:${profileId}`).emit('notification:read', {
    notificationId,
    unreadCount,
  });
  sendSuccess(res, StatusCodes.OK, notification, 'Notification marked as read');
};

export const markAllRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const profileId = await resolveProfileId(req);

  if (!profileId) {
    sendError(res, StatusCodes.NOT_FOUND, 'User profile not found');
    return;
  }

  const modifiedCount = await markAllNotificationsRead(profileId);
  getSocket().to(`profile:${profileId}`).emit('notifications:read-all', {
    unreadCount: 0,
  });
  sendSuccess(
    res,
    StatusCodes.OK,
    { modifiedCount, unreadCount: 0 },
    'Notifications marked as read',
  );
};
